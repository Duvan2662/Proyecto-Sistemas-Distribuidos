import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ArtesModule } from './artes.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ArtesModule,
    {
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:5003',
        package: 'biblioteca',
        protoPath: join(__dirname, '../../common/proto/biblioteca.proto'),
      },
    },
  );

  await app.listen();
  console.log('🟢 Nodo ARTES corriendo en puerto gRPC 5003');
}

bootstrap();
