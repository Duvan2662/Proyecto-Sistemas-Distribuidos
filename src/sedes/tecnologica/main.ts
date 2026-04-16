import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { TecnologicaModule } from './tecnologica.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TecnologicaModule,
    {
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:5002',
        package: 'biblioteca',
        protoPath: join(__dirname, '../../common/proto/biblioteca.proto'),
      },
    },
  );

  await app.listen();
  console.log('🟢 Nodo TECNOLÓGICA corriendo en puerto gRPC 5002');
}

bootstrap();
