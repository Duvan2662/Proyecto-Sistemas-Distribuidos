import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from '../../common/entities/libro.entity';
import { Sede } from '../../common/entities/sede.entity';
import { Prestamo } from '../../common/entities/prestamo.entity';
import { Usuario } from '../../common/entities/usuario.entity';
import { SedeController } from '../sede.controller';
import { SedeService } from '../sede.service';

export interface SedeModuleOptions {
  nombreSede: string;
  dbPort: number;
  dbName: string;
}

@Module({})
export class SedeModuleFactory {
  static create(options: SedeModuleOptions): DynamicModule {
    return {
      module: SedeModuleFactory,
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASS,
          database: options.dbName,
          entities: [Libro, Sede, Prestamo, Usuario],
          synchronize: true, // Solo para desarrollo — en producción usar migraciones
          logging: false,
        }),
        TypeOrmModule.forFeature([Libro, Sede, Prestamo, Usuario]),
      ],
      controllers: [SedeController],
      providers: [
        {
          provide: SedeService,
          useFactory: (libroRepo, sedeRepo, prestamoRepo) =>
            new SedeService(libroRepo, sedeRepo, prestamoRepo, options.nombreSede),
          inject: ['LibroRepository', 'SedeRepository', 'PrestamoRepository'],
        },
      ],
    };
  }
}
