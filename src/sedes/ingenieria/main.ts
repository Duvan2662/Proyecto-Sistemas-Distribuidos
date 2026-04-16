import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { IngenieriaModule } from './ingenieria.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    IngenieriaModule,
    {
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:5001',
        package: 'biblioteca',
        protoPath: join(__dirname, '../../common/proto/biblioteca.proto'),
      },
    },
  );

  await app.listen();
  console.log('🟢 Nodo INGENIERÍA corriendo en puerto gRPC 5001');
}

bootstrap();
