# Sistema Distribuido — Biblioteca Universidad Distrital
### Sistemas Distribuidos · RPC con gRPC · NestJS · PostgreSQL

---

## Arquitectura

```
[Angular Frontend]
       |
       | HTTP REST
       v
[API Gateway :3000]  ← punto de entrada único
       |
       | gRPC (RPC)
  _____|______________________
  |           |              |
  v           v              v
[Ingeniería] [Tecnológica] [Artes]
[:5001]      [:5002]       [:5003]
  |           |              |
[DB_ing]   [DB_tec]      [DB_art]
```

---

## Requisitos

- Node.js 18+
- PostgreSQL corriendo en localhost:5432
- Usuario: `postgres` / Contraseña: `Duvan26-`

---

## Instalación

```bash
npm install
```

## Crear las bases de datos en PostgreSQL

```sql
CREATE DATABASE biblioteca_ingenieria;
CREATE DATABASE biblioteca_tecnologica;
CREATE DATABASE biblioteca_artes;
```

## Cargar datos iniciales (seed)

```bash
npm run seed
```

Esto crea libros en cada sede y sus réplicas en los demás nodos.

---

## Correr el sistema

### Opción A — Todos los nodos activos (sistema normal)

Abrir 4 terminales separadas:

```bash
# Terminal 1 — Nodo Ingeniería (gRPC :5001)
npm run nodo:ingenieria

# Terminal 2 — Nodo Tecnológica (gRPC :5002)
npm run nodo:tecnologica

# Terminal 3 — Nodo Artes (gRPC :5003)
npm run nodo:artes

# Terminal 4 — API Gateway (HTTP :3000)
npm run gateway
```

O con un solo comando (requiere concurrently):

```bash
npm run start:all
```

---

### Opción B — Demostrar TOLERANCIA A FALLOS (apagar Tecnológica)

```bash
# Solo levantar Ingeniería, Artes y Gateway (Tecnológica apagada)
npm run start:sin-tecnologica
```

---

## Endpoints para probar

### Buscar libro (con fallover automático)
```bash
# Buscar desde Tecnológica (si está caída, responderá otro nodo)
GET http://localhost:3000/api/libros/buscar?titulo=redes&sede=tecnologica

# Respuesta cuando hay fallover:
# {
#   "titulo": "Redes de computadores",
#   "estado": "disponible",
#   "nodo_respondio": "ingenieria",     ← respondió otro nodo
#   "fallover_activado": true,           ← se activó tolerancia a fallos
#   "es_replica": true                   ← son datos replicados
# }
```

### Listar libros de una sede
```bash
GET http://localhost:3000/api/libros?sede=ingenieria
```

### Realizar préstamo
```bash
POST http://localhost:3000/api/prestamos
Content-Type: application/json

{
  "libroId": "uuid-del-libro",
  "usuarioId": "uuid-del-usuario",
  "sede": "ingenieria"
}
```

### Devolver libro
```bash
POST http://localhost:3000/api/prestamos/{prestamoId}/devolver
Content-Type: application/json

{ "sede": "ingenieria" }
```

### Estado de los nodos (health check)
```bash
GET http://localhost:3000/api/nodos/estado

# Respuesta:
# {
#   "ingenieria":  { "activo": true,  "latencia_ms": 12, "puerto": 5001 },
#   "tecnologica": { "activo": false, "latencia_ms": null, "puerto": 5002 },
#   "artes":       { "activo": true,  "latencia_ms": 8,  "puerto": 5003 }
# }
```

---

## Conceptos del sistema distribuido demostrados

| Concepto               | Implementación                                                    |
|------------------------|-------------------------------------------------------------------|
| RPC (gRPC)             | Comunicación entre Gateway y nodos vía `.proto`                  |
| Replicación de datos   | Cada nodo guarda copias de libros de otras sedes (`esReplica`)   |
| Tolerancia a fallos    | Gateway hace fallover automático con timeout de 3 segundos       |
| Consistencia eventual  | Réplicas se actualizan en background tras cada préstamo          |
| Concurrencia           | Múltiples nodos responden en paralelo                            |
| Nodos independientes   | Cada sede tiene su propia base de datos PostgreSQL               |

---

## Estructura del proyecto

```
src/
├── common/
│   ├── entities/          # Sede, Libro, Usuario, Prestamo
│   └── proto/             # biblioteca.proto (contrato gRPC)
├── gateway/
│   ├── gateway.module.ts  # Módulo del gateway
│   ├── gateway.service.ts # Lógica de enrutamiento y fallover
│   ├── gateway.controller.ts # Endpoints HTTP
│   └── main.ts            # Arranca en :3000
└── sedes/
    ├── sede.service.ts    # Lógica de negocio + replicación
    ├── sede.controller.ts # Métodos gRPC
    ├── ingenieria/        # Nodo Ingeniería (:5001)
    ├── tecnologica/       # Nodo Tecnológica (:5002)
    └── artes/             # Nodo Artes (:5003)
```
