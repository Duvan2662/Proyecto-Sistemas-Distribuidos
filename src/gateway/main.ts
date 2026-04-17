import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  const port = process.env.GATEWAY_PORT || '3000';

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await app.listen(port);
  console.log(`API Gateway corriendo en http://localhost:${port}`);
  console.log('   Endpoints disponibles:');
  console.log('   GET  /api/libros/buscar?titulo=X&sede=Y');
  console.log('   GET  /api/libros?sede=Y');
  console.log('   POST /api/prestamos');
  console.log('   POST /api/prestamos/:id/devolver');
  console.log('   GET  /api/nodos/estado');
}

bootstrap();