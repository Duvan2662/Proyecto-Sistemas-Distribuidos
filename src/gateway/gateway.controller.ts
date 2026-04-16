import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { GatewayService } from './gateway.service';

@Controller('api')
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private readonly gatewayService: GatewayService) {}

  // GET /api/libros/buscar?titulo=calculo&sede=tecnologica
  @Get('libros/buscar')
  async buscarLibro(
    @Query('titulo') titulo: string,
    @Query('sede') sede: string = 'ingenieria',
  ) {
    this.logger.log(`HTTP GET /libros/buscar titulo="${titulo}" sede="${sede}"`);
    return this.gatewayService.buscarLibro(titulo, sede);
  }

  // GET /api/libros?sede=ingenieria
  @Get('libros')
  async listarLibros(@Query('sede') sede: string = 'ingenieria') {
    this.logger.log(`HTTP GET /libros sede="${sede}"`);
    return this.gatewayService.listarLibros(sede);
  }

  // POST /api/prestamos
  // Body: { libroId, usuarioId, sede }
  @Post('prestamos')
  async realizarPrestamo(
    @Body() body: { libroId: string; usuarioId: string; sede: string },
  ) {
    this.logger.log(`HTTP POST /prestamos libro="${body.libroId}" sede="${body.sede}"`);
    return this.gatewayService.realizarPrestamo(body.libroId, body.usuarioId, body.sede);
  }

  // POST /api/prestamos/:id/devolver
  @Post('prestamos/:id/devolver')
  async devolverLibro(
    @Param('id') prestamoId: string,
    @Body() body: { sede: string },
  ) {
    this.logger.log(`HTTP POST /prestamos/${prestamoId}/devolver sede="${body.sede}"`);
    return this.gatewayService.devolverLibro(prestamoId, body.sede);
  }

  // GET /api/nodos/estado — muestra qué nodos están activos (útil para demostrar tolerancia a fallos)
  @Get('nodos/estado')
  async estadoNodos() {
    this.logger.log('HTTP GET /nodos/estado — verificando salud de nodos');
    return this.gatewayService.estadoNodos();
  }
}
