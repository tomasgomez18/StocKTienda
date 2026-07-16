import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { errorHandler } from './middlewares/ErrorMiddleware.js';
import AuthRoutes from './modules/Auth/AuthRoutes.js';

const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`FATAL: Missing required environment variable ${env}`);
    process.exit(1);
  }
}
import SupplierRoutes from './modules/Supplier/SupplierRoutes.js';
import ProductRoutes from './modules/Product/ProductRoutes.js';
import ReturnRoutes from './modules/Return/ReturnRoutes.js';
import SaleRoutes from './modules/Sale/SaleRoutes.js';
import SalesAuthRoutes from './modules/SalesAuth/SalesAuthRoutes.js';

const app = express();
app.set('env', process.env.NODE_ENV || 'development');
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({ origin: allowedOrigins }));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Demasiados intentos. Intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authLimiter, AuthRoutes);
app.use('/api/suppliers', SupplierRoutes);
app.use('/api/products', ProductRoutes);
app.use('/api/returns', ReturnRoutes);
app.use('/api/sales-auth', authLimiter, SalesAuthRoutes);
app.use('/api/sales', SaleRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
});
