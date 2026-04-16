import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

interface LibroServiceGrpc {
  BuscarLibro(data: any): any;
  ListarLibros(data: any): any;
  RealizarPrestamo(data: any): any;
  DevolverLibro(data: any): any;
  ReplicarDatos(data: any): any;
}

// Orden de fallover: si una sede cae, el gateway prueba las siguientes en orden
const ORDEN_FALLOVER: Record<string, string[]> = {
  ingenieria:  ['ingenieria', 'tecnologica', 'artes'],
  tecnologica: ['tecnologica', 'ingenieria', 'artes'],
  artes:       ['artes', 'ingenieria', 'tecnologica'],
};

@Injectable()
export class GatewayService implements OnModuleInit {
  private readonly logger = new Logger(GatewayService.name);
  private servicios: Map<string, LibroServiceGrpc> = new Map();

  constructor(
    @Inject('NODO_INGENIERIA')  private clientIngenieria: ClientGrpc,
    @Inject('NODO_TECNOLOGICA') private clientTecnologica: ClientGrpc,
    @Inject('NODO_ARTES')       private clientArtes: ClientGrpc,
  ) {}

  onModuleInit() {
    this.servicios.set('ingenieria',  this.clientIngenieria.getService<LibroServiceGrpc>('LibroService'));
    this.servicios.set('tecnologica', this.clientTecnologica.getService<LibroServiceGrpc>('LibroService'));
    this.servicios.set('artes',       this.clientArtes.getService<LibroServiceGrpc>('LibroService'));
    this.logger.log('Gateway iniciado — conectado a 3 nodos via gRPC');
  }

  // ─── BUSCAR LIBRO CON FALLOVER AUTOMÁTICO ────────────────────────────────
  async buscarLibro(titulo: string, sedeOrigen: string = 'ingenieria') {
    const ordenIntento = ORDEN_FALLOVER[sedeOrigen] || Object.keys(ORDEN_FALLOVER);

    for (const sede of ordenIntento) {
      const resultado = await this.llamarNodo(sede, 'BuscarLibro', {
        titulo,
        sede_origen: sedeOrigen,
      });

      if (resultado) {
        if (sede !== sedeOrigen) {
          this.logger.warn(
            `FALLOVER: Nodo [${sedeOrigen}] no disponible. Respuesta obtenida desde [${sede}]`
          );
        }
        return {
          ...resultado,
          nodo_respondio: sede,
          fallover_activado: sede !== sedeOrigen,
        };
      }

      this.logger.error(`Nodo [${sede}] no responde. Intentando siguiente...`);
    }

    return {
      titulo: 'No encontrado',
      mensaje: 'Todos los nodos están caídos',
      fallover_activado: true,
    };
  }

  // ─── LISTAR LIBROS DE UNA SEDE ────────────────────────────────────────────
  async listarLibros(sede: string) {
    const servicio = this.servicios.get(sede);
    if (!servicio) return { libros: [], error: 'Sede no encontrada' };

    const resultado = await this.llamarNodo(sede, 'ListarLibros', { sede_id: '' });
    return resultado || { libros: [] };
  }

  // ─── REALIZAR PRÉSTAMO ────────────────────────────────────────────────────
  async realizarPrestamo(libroId: string, usuarioId: string, sede: string) {
    const resultado = await this.llamarNodo(sede, 'RealizarPrestamo', {
      libro_id: libroId,
      usuario_id: usuarioId,
      sede_id: sede,
    });

    if (!resultado) {
      return { exitoso: false, mensaje: `Nodo [${sede}] no disponible para procesar el préstamo` };
    }

    return resultado;
  }

  // ─── DEVOLVER LIBRO ───────────────────────────────────────────────────────
  async devolverLibro(prestamoId: string, sede: string) {
    const resultado = await this.llamarNodo(sede, 'DevolverLibro', {
      prestamo_id: prestamoId,
    });

    if (!resultado) {
      return { exitoso: false, mensaje: `Nodo [${sede}] no disponible` };
    }

    return resultado;
  }

  // ─── ESTADO DE LOS NODOS (HEALTH CHECK) ──────────────────────────────────
  async estadoNodos() {
    const estados: Record<string, any> = {};

    for (const sede of ['ingenieria', 'tecnologica', 'artes']) {
      const inicio = Date.now();
      const resultado = await this.llamarNodo(sede, 'ListarLibros', { sede_id: '' });
      const latencia = Date.now() - inicio;

      estados[sede] = {
        activo: resultado !== null,
        latencia_ms: resultado !== null ? latencia : null,
        puerto: sede === 'ingenieria' ? 5001 : sede === 'tecnologica' ? 5002 : 5003,
      };
    }

    return estados;
  }

  // ─── LLAMADA GENÉRICA A UN NODO CON TIMEOUT ──────────────────────────────
  private async llamarNodo(sede: string, metodo: string, datos: any): Promise<any> {
    const servicio = this.servicios.get(sede);
    if (!servicio) return null;

    try {
      const resultado = await firstValueFrom(
        servicio[metodo](datos).pipe(
          timeout(3000),
          catchError(err => {
            this.logger.error(`Nodo [${sede}].${metodo} falló: ${err.message}`);
            return of(null);
          })
        )
      );
      return resultado;
    } catch (e: any) {
      this.logger.error(`Error llamando nodo [${sede}]: ${e.message}`);
      return null;
    }
  }
}
