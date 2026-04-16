import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  app.enableCors({
    origin: '*', // En producción especificar el dominio del frontend Angular
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await app.listen(3000);
  console.log('🟢 API Gateway corriendo en http://localhost:3000');
  console.log('   Endpoints disponibles:');
  console.log('   GET  /api/libros/buscar?titulo=X&sede=Y');
  console.log('   GET  /api/libros?sede=Y');
  console.log('   POST /api/prestamos');
  console.log('   POST /api/prestamos/:id/devolver');
  console.log('   GET  /api/nodos/estado');
}

bootstrap();
