import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const isTs = __filename.endsWith('.ts');
const migrationsPath = isTs
  ? path.join(__dirname, '..', 'migrations', '*.ts')
  : path.join(__dirname, '..', 'migrations', '*.js');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'user_service',

  synchronize: false,
  logging: process.env.NODE_ENV === 'development',

  entities: [User],
  migrations: [migrationsPath],
});
