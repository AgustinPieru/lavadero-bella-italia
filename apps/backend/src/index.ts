import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import prisma from './lib/prisma';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import clientesRoutes from './modules/clientes/clientes.routes';
import serviciosRoutes from './modules/servicios/servicios.routes';
import turnosRoutes from './modules/turnos/turnos.routes';
import horariosRoutes from './modules/horarios/horarios.routes';
import facturasRoutes from './modules/facturas/facturas.routes';
import gastosRoutes from './modules/gastos/gastos.routes';
import resenasRoutes from './modules/resenas/resenas.routes';
import reportesRoutes from './modules/reportes/reportes.routes';
import turneroRoutes from './modules/turnero/turnero.routes';
import { iniciarWhatsappSiCorresponde } from './lib/whatsapp/client';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV === 'production') {
  app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
}

// Health check básico (no toca la base)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), service: 'Bella Italia API' });
});

// Health check de base de datos — prueba la conexión real con Postgres vía Prisma.
app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'connected' });
  } catch (err: any) {
    res.status(503).json({ status: 'ERROR', database: 'disconnected', message: err.message });
  }
});

// Rutas de módulos se van agregando acá a medida que avanzamos de etapa.
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clientes', clientesRoutes);
app.use('/api/v1/servicios', serviciosRoutes);
app.use('/api/v1/turnos', turnosRoutes);
app.use('/api/v1/horarios', horariosRoutes);
app.use('/api/v1/facturas', facturasRoutes);
app.use('/api/v1/gastos', gastosRoutes);
app.use('/api/v1/resenas', resenasRoutes);
app.use('/api/v1/reportes', reportesRoutes);
app.use('/api/v1/turnero', turneroRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const shutdown = async () => {
  console.log('Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

iniciarWhatsappSiCorresponde();

app.listen(env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
  console.log(`Health: http://localhost:${env.PORT}/api/health`);
  console.log(`Health DB: http://localhost:${env.PORT}/api/health/db`);
});

export default app;
