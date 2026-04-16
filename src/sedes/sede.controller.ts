import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SedeService } from './sede.service';

@Controller()
export class SedeController {
  private readonly logger = new Logger(SedeController.name);

  constructor(private readonly sedeService: SedeService) {}

  @GrpcMethod('LibroService', 'BuscarLibro')
  async buscarLibro(data: { titulo: string; sede_origen: string }) {
    this.logger.log(`gRPC BuscarLibro: "${data.titulo}" desde ${data.sede_origen}`);
    return this.sedeService.buscarLibro(data.titulo, data.sede_origen);
  }

  @GrpcMethod('LibroService', 'ListarLibros')
  async listarLibros(data: { sede_id: string }) {
    const libros = await this.sedeService.listarLibros(data.sede_id);
    return { libros };
  }

  @GrpcMethod('LibroService', 'RealizarPrestamo')
  async realizarPrestamo(data: { libro_id: string; usuario_id: string; sede_id: string }) {
    return this.sedeService.realizarPrestamo(data.libro_id, data.usuario_id, data.sede_id);
  }

  @GrpcMethod('LibroService', 'DevolverLibro')
  async devolverLibro(data: { prestamo_id: string }) {
    return this.sedeService.devolverLibro(data.prestamo_id);
  }

  @GrpcMethod('LibroService', 'ReplicarDatos')
  async replicarDatos(data: { sede_origen: string; libros: any[] }) {
    return this.sedeService.replicarDatos(data.sede_origen, data.libros);
  }
}
