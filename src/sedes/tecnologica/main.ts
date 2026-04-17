import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { TecnologicaModule } from './tecnologica.module';

async function bootstrap() {
  const port = process.env.GRPC_PORT_TECNOLOGICA || '5002';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TecnologicaModule,
    {
      transport: Transport.GRPC,
      options: {
        url: `0.0.0.0:${port}`,
        package: 'biblioteca',
        protoPath: join(__dirname, '../../common/proto/biblioteca.proto'),
      },
    },
  );

  await app.listen();
  console.log(`Nodo TECNOLOGICA corriendo en puerto gRPC ${port}`);
}

bootstrap();