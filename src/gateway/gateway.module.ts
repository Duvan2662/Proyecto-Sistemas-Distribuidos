import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

const PROTO_PATH = join(__dirname, '../common/proto/biblioteca.proto');

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NODO_INGENIERIA',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:5001',
          package: 'biblioteca',
          protoPath: PROTO_PATH,
        },
      },
      {
        name: 'NODO_TECNOLOGICA',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:5002',
          package: 'biblioteca',
          protoPath: PROTO_PATH,
        },
      },
      {
        name: 'NODO_ARTES',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:5003',
          package: 'biblioteca',
          protoPath: PROTO_PATH,
        },
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
