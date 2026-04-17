// Elimina esto:
// const NODOS_HERMANOS = {
//   ingenieria:  { host: 'localhost', port: 5001 },
//   tecnologica: { host: 'localhost', port: 5002 },
//   artes:       { host: 'localhost', port: 5003 },
// };

// Y ponlo así:
const NODOS_HERMANOS = {
  ingenieria: {
    host: process.env.GRPC_HOST_INGENIERIA || 'localhost',
    port: parseInt(process.env.GRPC_PORT_INGENIERIA) || 5001,
  },
  tecnologica: {
    host: process.env.GRPC_HOST_TECNOLOGICA || 'localhost',
    port: parseInt(process.env.GRPC_PORT_TECNOLOGICA) || 5002,
  },
  artes: {
    host: process.env.GRPC_HOST_ARTES || 'localhost',
    port: parseInt(process.env.GRPC_PORT_ARTES) || 5003,
  },
};