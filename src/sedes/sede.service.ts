import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { Libro, EstadoLibro } from '../common/entities/libro.entity';
import { Sede } from '../common/entities/sede.entity';
import { Prestamo, EstadoPrestamo } from '../common/entities/prestamo.entity';

const PROTO_PATH = join(__dirname, '../../common/proto/biblioteca.proto');

// Elimina esto:
// const NODOS_HERMANOS = {
//   ingenieria:  { host: 'localhost', port: 5001 },
//   tecnologica: { host: 'localhost', port: 5002 },
//   artes:       { host: 'localhost', port: 5003 },
// };

// Y ponlo así:
const NODOS_HERMANOS = {
  ingenieria: {
    host: process.env.GRPC_HOST_INGENIERIA || 'localhost',
    port: parseInt(process.env.GRPC_PORT_INGENIERIA) || 5001,
  },
  tecnologica: {
    host: process.env.GRPC_HOST_TECNOLOGICA || 'localhost',
    port: parseInt(process.env.GRPC_PORT_TECNOLOGICA) || 5002,
  },
  artes: {
    host: process.env.GRPC_HOST_ARTES || 'localhost',
    port: parseInt(process.env.GRPC_PORT_ARTES) || 5003,
  },
};

@Injectable()
export class SedeService implements OnModuleInit {
  private readonly logger = new Logger(SedeService.name);
  private clientesGrpc: Map<string, any> = new Map();

  constructor(
    @InjectRepository(Libro)
    private libroRepo: Repository<Libro>,
    @InjectRepository(Sede)
    private sedeRepo: Repository<Sede>,
    @InjectRepository(Prestamo)
    private prestamoRepo: Repository<Prestamo>,
    private readonly nombreSede: string,
  ) {}

  onModuleInit() {
    // Inicializa clientes gRPC hacia los otros nodos
    for (const [sede, config] of Object.entries(NODOS_HERMANOS)) {
      if (sede !== this.nombreSede) {
        try {
          const client: ClientGrpc = new (require('@nestjs/microservices').ClientProxyFactory).create({
            transport: Transport.GRPC,
            options: {
              url: `${config.host}:${config.port}`,
              package: 'biblioteca',
              protoPath: PROTO_PATH,
            },
          });
          this.clientesGrpc.set(sede, client);
        } catch (e) {
          this.logger.warn(`No se pudo inicializar cliente para ${sede}`);
        }
      }
    }
    this.logger.log(`Nodo [${this.nombreSede}] iniciado`);
  }

  // ─── BUSCAR LIBRO CON TOLERANCIA A FALLOS ────────────────────────────────
  async buscarLibro(titulo: string, sedeOrigen: string): Promise<any> {
    this.logger.log(`[${this.nombreSede}] Buscando "${titulo}" solicitado desde ${sedeOrigen}`);

    // 1. Buscar primero en la sede local (incluye réplicas)
    const libros = await this.libroRepo.find({
      where: [{ titulo }],
      relations: ['sede'],
    });

    const encontrados = libros.filter(l =>
      l.titulo.toLowerCase().includes(titulo.toLowerCase())
    );

    if (encontrados.length > 0) {
      const libro = encontrados[0];
      const esReplica = libro.esReplica;

      this.logger.log(
        `[${this.nombreSede}] Libro encontrado ${esReplica ? '(RÉPLICA de nodo caído)' : '(datos primarios)'}`
      );

      return {
        id: libro.id,
        titulo: libro.titulo,
        autor: libro.autor,
        isbn: libro.isbn,
        estado: libro.estado,
        sede_nombre: libro.sede?.nombre || this.nombreSede,
        es_replica: esReplica,
      };
    }

    // 2. Si no está localmente, intentar en nodos hermanos vía RPC
    this.logger.warn(`[${this.nombreSede}] Libro no encontrado localmente, consultando otros nodos...`);
    return await this.buscarEnNodosHermanos(titulo);
  }

  // ─── BUSCAR EN NODOS HERMANOS (FALLOVER) ─────────────────────────────────
  private async buscarEnNodosHermanos(titulo: string): Promise<any> {
    for (const [sede, client] of this.clientesGrpc.entries()) {
      try {
        this.logger.log(`[${this.nombreSede}] Intentando RPC a nodo ${sede}...`);
        const servicio = client.getService('LibroService');

        const resultado = await firstValueFrom(
          servicio.BuscarLibro({ titulo, sede_origen: this.nombreSede }).pipe(
            timeout(3000), // 3 segundos de timeout — si no responde, nodo caído
            catchError(err => {
              this.logger.error(`[${this.nombreSede}] Nodo ${sede} NO responde (posiblemente caído): ${err.message}`);
              return of(null);
            })
          )
        );

        if (resultado) {
          this.logger.log(`[${this.nombreSede}] Respuesta obtenida del nodo ${sede}`);
          return resultado;
        }
      } catch (e: any) {
        this.logger.error(`[${this.nombreSede}] Error consultando nodo ${sede}: ${e.message}`);
      }
    }

    return { titulo: 'No encontrado', estado: 'no_disponible', sede_nombre: 'ninguna', es_replica: false };
  }

  // ─── LISTAR LIBROS DE ESTA SEDE ───────────────────────────────────────────
  async listarLibros(sedeId?: string): Promise<any[]> {
    const query = sedeId
      ? { sedeId, esReplica: false }
      : { esReplica: false };

    const libros = await this.libroRepo.find({ where: query, relations: ['sede'] });

    return libros.map(l => ({
      id: l.id,
      titulo: l.titulo,
      autor: l.autor,
      isbn: l.isbn,
      estado: l.estado,
      sede_nombre: l.sede?.nombre || this.nombreSede,
      es_replica: l.esReplica,
    }));
  }

  // ─── REALIZAR PRÉSTAMO ────────────────────────────────────────────────────
  async realizarPrestamo(libroId: string, usuarioId: string, sedeId: string): Promise<any> {
    const libro = await this.libroRepo.findOne({ where: { id: libroId } });

    if (!libro) {
      return { exitoso: false, mensaje: 'Libro no encontrado', estado: 'error' };
    }

    if (libro.estado !== EstadoLibro.DISPONIBLE) {
      return { exitoso: false, mensaje: `Libro no disponible. Estado: ${libro.estado}`, estado: libro.estado };
    }

    // Actualizar estado del libro
    libro.estado = EstadoLibro.PRESTADO;
    await this.libroRepo.save(libro);

    // Crear registro de préstamo
    const prestamo = this.prestamoRepo.create({
      libroId,
      usuarioId,
      sedeId,
      estado: EstadoPrestamo.ACTIVO,
    });
    const savedPrestamo = await this.prestamoRepo.save(prestamo);

    this.logger.log(`[${this.nombreSede}] Préstamo creado: ${savedPrestamo.id}`);

    // Replicar el cambio a los demás nodos en background
    this.replicarCambioEstado(libro).catch(e =>
      this.logger.warn(`Replicación en background falló: ${e.message}`)
    );

    return {
      id: savedPrestamo.id,
      exitoso: true,
      mensaje: 'Préstamo realizado con éxito',
      estado: EstadoPrestamo.ACTIVO,
    };
  }

  // ─── DEVOLVER LIBRO ───────────────────────────────────────────────────────
  async devolverLibro(prestamoId: string): Promise<any> {
    const prestamo = await this.prestamoRepo.findOne({
      where: { id: prestamoId },
      relations: ['libro'],
    });

    if (!prestamo) {
      return { exitoso: false, mensaje: 'Préstamo no encontrado', estado: 'error' };
    }

    prestamo.estado = EstadoPrestamo.DEVUELTO;
    prestamo.fechaDevolucion = new Date();
    await this.prestamoRepo.save(prestamo);

    prestamo.libro.estado = EstadoLibro.DISPONIBLE;
    await this.libroRepo.save(prestamo.libro);

    this.logger.log(`[${this.nombreSede}] Libro devuelto: ${prestamo.libro.titulo}`);

    return {
      id: prestamo.id,
      exitoso: true,
      mensaje: 'Libro devuelto con éxito',
      estado: EstadoPrestamo.DEVUELTO,
    };
  }

  // ─── RECIBIR DATOS REPLICADOS DE OTRO NODO ───────────────────────────────
  async replicarDatos(sedeOrigen: string, libros: any[]): Promise<any> {
    this.logger.log(`[${this.nombreSede}] Recibiendo réplica de ${sedeOrigen}: ${libros.length} libros`);

    let replicados = 0;
    for (const libroData of libros) {
      const existe = await this.libroRepo.findOne({ where: { isbn: libroData.isbn } });

      if (!existe) {
        const replica = this.libroRepo.create({
          id: libroData.id,
          titulo: libroData.titulo,
          autor: libroData.autor,
          isbn: libroData.isbn,
          estado: libroData.estado,
          sedeId: libroData.sede_id,
          esReplica: true, // Marcado como réplica — no es el dato primario
        });
        await this.libroRepo.save(replica);
        replicados++;
      } else {
        // Actualizar el estado si ya existe la réplica
        existe.estado = libroData.estado;
        await this.libroRepo.save(existe);
      }
    }

    return { exitoso: true, registros_replicados: replicados };
  }

  // ─── REPLICAR CAMBIO DE ESTADO A NODOS HERMANOS ──────────────────────────
  private async replicarCambioEstado(libro: Libro): Promise<void> {
    for (const [sede, client] of this.clientesGrpc.entries()) {
      try {
        const servicio = client.getService('LibroService');
        await firstValueFrom(
          servicio.ReplicarDatos({
            sede_origen: this.nombreSede,
            libros: [{
              id: libro.id,
              titulo: libro.titulo,
              autor: libro.autor,
              isbn: libro.isbn,
              estado: libro.estado,
              sede_id: libro.sedeId,
            }],
          }).pipe(
            timeout(2000),
            catchError(() => of(null))
          )
        );
        this.logger.log(`[${this.nombreSede}] Replicación enviada a ${sede}`);
      } catch (e) {
        this.logger.warn(`[${this.nombreSede}] No se pudo replicar a ${sede} (nodo posiblemente caído)`);
      }
    }
  }
}
