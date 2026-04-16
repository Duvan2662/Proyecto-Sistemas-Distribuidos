/**
 * SEED — datos iniciales para demostrar el sistema
 * Ejecutar: ts-node src/seed.ts
 *
 * Crea libros en cada sede y réplicas entre nodos
 * para poder demostrar la tolerancia a fallos.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { Libro, EstadoLibro } from './common/entities/libro.entity';
import { Sede } from './common/entities/sede.entity';
import { Usuario, RolUsuario } from './common/entities/usuario.entity';

const SEDES_CONFIG = [
  { nombre: 'ingenieria',  dbName: 'biblioteca_ingenieria',  port: 5432 },
  { nombre: 'tecnologica', dbName: 'biblioteca_tecnologica', port: 5432 },
  { nombre: 'artes',       dbName: 'biblioteca_artes',       port: 5432 },
];

const LIBROS_POR_SEDE: Record<string, any[]> = {
  ingenieria: [
    { titulo: 'Cálculo diferencial', autor: 'James Stewart', isbn: '978-0-538-49781-7' },
    { titulo: 'Algoritmos y estructuras de datos', autor: 'Cormen', isbn: '978-0-262-03384-8' },
    { titulo: 'Sistemas operativos modernos', autor: 'Tanenbaum', isbn: '978-0-13-359162-0' },
  ],
  tecnologica: [
    { titulo: 'Redes de computadores', autor: 'Tanenbaum', isbn: '978-0-13-212695-3' },
    { titulo: 'Ingeniería de software', autor: 'Pressman', isbn: '978-0-07-337597-7' },
    { titulo: 'Base de datos relacionales', autor: 'Silberschatz', isbn: '978-0-07-352332-3' },
  ],
  artes: [
    { titulo: 'Historia del arte', autor: 'Ernst Gombrich', isbn: '978-0-7148-3247-1' },
    { titulo: 'Diseño gráfico moderno', autor: 'Philip Meggs', isbn: '978-0-471-29198-5' },
  ],
};

async function seed() {
  for (const config of SEDES_CONFIG) {
    console.log(`\nSeeding nodo: ${config.nombre}`);

    const ds = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS,
      database: config.dbName,
      entities: [Libro, Sede, Usuario],
      synchronize: true,
    });

    await ds.initialize();

    const sedeRepo = ds.getRepository(Sede);
    const libroRepo = ds.getRepository(Libro);
    const usuarioRepo = ds.getRepository(Usuario);

    // Crear registro de sede
    let sede = await sedeRepo.findOne({ where: { nombre: config.nombre } });
    if (!sede) {
      sede = sedeRepo.create({
        nombre: config.nombre,
        ciudad: 'Bogotá',
        direccion: `Sede ${config.nombre} - Universidad Distrital`,
      });
      sede = await sedeRepo.save(sede);
      console.log(`  Sede creada: ${sede.nombre} (${sede.id})`);
    }

    // Crear libros propios de esta sede
    const libros = LIBROS_POR_SEDE[config.nombre] || [];
    for (const libroData of libros) {
      const existe = await libroRepo.findOne({ where: { isbn: libroData.isbn } });
      if (!existe) {
        const libro = libroRepo.create({
          ...libroData,
          estado: EstadoLibro.DISPONIBLE,
          sedeId: sede.id,
          esReplica: false,
        });
        await libroRepo.save(libro);
        console.log(`  Libro creado: ${libroData.titulo}`);
      }
    }

    // Crear réplicas de libros de otras sedes en este nodo
    // (esto es lo que permite la tolerancia a fallos)
    for (const otraSede of SEDES_CONFIG) {
      if (otraSede.nombre !== config.nombre) {
        const librosOtra = LIBROS_POR_SEDE[otraSede.nombre] || [];
        for (const libroData of librosOtra) {
          const existe = await libroRepo.findOne({ where: { isbn: libroData.isbn } });
          if (!existe) {
            const replica = libroRepo.create({
              ...libroData,
              estado: EstadoLibro.DISPONIBLE,
              sedeId: sede.id,
              esReplica: true, // ← marcado como réplica
            });
            await libroRepo.save(replica);
            console.log(`  Replica creada: ${libroData.titulo} (de ${otraSede.nombre})`);
          }
        }
      }
    }

    // Crear usuario de prueba
    const emailPrueba = `admin@${config.nombre}.udistrital.edu.co`;
    const usuarioExiste = await usuarioRepo.findOne({ where: { email: emailPrueba } });
    if (!usuarioExiste) {
      const usuario = usuarioRepo.create({
        nombre: `Administrador ${config.nombre}`,
        email: emailPrueba,
        rol: RolUsuario.BIBLIOTECARIO,
      });
      await usuarioRepo.save(usuario);
      console.log(`  Usuario creado: ${emailPrueba}`);
    }

    await ds.destroy();
    console.log(`  ✔  Nodo ${config.nombre} listo`);
  }

  console.log('\nSeed completado. El sistema esta listo para demostrar tolerancia a fallos.');
}

seed().catch(console.error);
