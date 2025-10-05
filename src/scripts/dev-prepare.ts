import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ensureDatabase } from '../utils/ensureDatabase';

function run(cmd: string) {
  execSync(cmd, { stdio: 'inherit' });
}

async function main() {
  await ensureDatabase({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'user_service',
  });

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });

  const hasMigrations = fs.readdirSync(migrationsDir).some(f => f.endsWith('.ts') || f.endsWith('.js'));

  if (!hasMigrations) {
    console.log('🧱 No migrations found. Generating initial migration from entities...');
    run('npm run typeorm -- -d src/config/ormconfig.ts migration:generate src/migrations/InitSchema');

    const filesAfter = fs.readdirSync(migrationsDir)
      .filter(f => f.toLowerCase().includes('initschema') && f.endsWith('.ts'))
      .sort();

    if (filesAfter.length > 0) {
      const migPath = path.join(migrationsDir, filesAfter[filesAfter.length - 1]);
      let code = fs.readFileSync(migPath, 'utf8');

      code = code.replace(
        /public async up\(queryRunner: QueryRunner\): Promise<void> \{\s*/,
        (m) => m +
`    await queryRunner.query(\`CREATE EXTENSION IF NOT EXISTS "pgcrypto"\`);
    await queryRunner.query(\`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"\`);
`
      );

      fs.writeFileSync(migPath, code, 'utf8');
      console.log(`🔧 Patched migration with UUID extensions: ${path.basename(migPath)}`);
    } else {
      console.warn('⚠️ Could not locate generated migration file to patch extensions.');
    }
  } else {
    console.log('📦 Migrations already exist. Skipping generation.');
  }

  console.log('📤 Running migrations...');
  run('npm run typeorm -- -d src/config/ormconfig.ts migration:run');
  console.log('✅ Migrations up to date.');
}

main().catch((e) => {
  console.error('❌ dev-prepare failed:', e);
  process.exit(1);
});
