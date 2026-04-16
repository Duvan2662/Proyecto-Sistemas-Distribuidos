import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from '../../common/entities/libro.entity';
import { Sede } from '../../common/entities/sede.entity';
import { Prestamo } from '../../common/entities/prestamo.entity';
import { Usuario } from '../../common/entities/usuario.entity';
import { SedeController } from '../sede.controller';
import { SedeService } from '../sede.service';
import { getRepositoryToken } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'tecnologica',
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'Duvan26-',
      database: 'biblioteca_tecnologica',
      entities: [Libro, Sede, Prestamo, Usuario],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([Libro, Sede, Prestamo, Usuario], 'tecnologica'),
  ],
  controllers: [SedeController],
  providers: [
    {
      provide: SedeService,
      useFactory: (libroRepo, sedeRepo, prestamoRepo) =>
        new SedeService(libroRepo, sedeRepo, prestamoRepo, 'tecnologica'),
      inject: [
        getRepositoryToken(Libro, 'tecnologica'),
        getRepositoryToken(Sede, 'tecnologica'),
        getRepositoryToken(Prestamo, 'tecnologica'),
      ],
    },
  ],
})
export class TecnologicaModule {}
