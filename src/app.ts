import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from './routes/user.routes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { AppDataSource } from './config/ormconfig';
import { UserService } from './services/user.service';
import { ensureDatabase } from './utils/ensureDatabase';
import { DataSourceOptions } from 'typeorm';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan((tokens, req, res) => {
  const status = Number(tokens.status(req, res));
  if (status < 400) return null;
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    status,
    '-', tokens['response-time'](req, res), 'ms'
  ].join(' ');
}));
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'User Service API'
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const initializeApp = async () => {
  try {
    const dsOpts = AppDataSource.options as DataSourceOptions & {
      host?: string; port?: number; username?: string; password?: string; database?: string; ssl?: any;
    };

    await ensureDatabase({
      host: (dsOpts.host as string) || process.env.DB_HOST || 'localhost',
      port: (dsOpts.port as number) || Number(process.env.DB_PORT) || 5432,
      user: (dsOpts.username as string) || process.env.DB_USERNAME || 'postgres',
      password: (dsOpts.password as string) || process.env.DB_PASSWORD || '',
      database: (dsOpts.database as string) || process.env.DB_NAME || 'user_service',
      ssl: !!dsOpts['ssl'],
    });

    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    await AppDataSource.runMigrations();
    console.log('✅ Migrations executed');

    await UserService.ensureAdminAndWriteTokenFile();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
};


initializeApp();

export default app;