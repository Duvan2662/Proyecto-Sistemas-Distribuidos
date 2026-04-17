import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import * as dotenv from 'dotenv';
dotenv.config();

const PROTO_PATH = join(__dirname, '../common/proto/biblioteca.proto');

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NODO_INGENIERIA',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            url: `${process.env.GRPC_HOST_INGENIERIA || 'localhost'}:${process.env.GRPC_PORT_INGENIERIA || '5001'}`,
            package: 'biblioteca',
            protoPath: PROTO_PATH,
          },
        }),
      },
      {
        name: 'NODO_TECNOLOGICA',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            url: `${process.env.GRPC_HOST_TECNOLOGICA || 'localhost'}:${process.env.GRPC_PORT_TECNOLOGICA || '5002'}`,
            package: 'biblioteca',
            protoPath: PROTO_PATH,
          },
        }),
      },
      {
        name: 'NODO_ARTES',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            url: `${process.env.GRPC_HOST_ARTES || 'localhost'}:${process.env.GRPC_PORT_ARTES || '5003'}`,
            package: 'biblioteca',
            protoPath: PROTO_PATH,
          },
        }),
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}