import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  
  dialect: 'postgresql',


  schema: './app/schema/schema.ts',
  
  
  out: './drizzle',

  dbCredentials: {
    host: process.env.DB_HOST|| 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME!,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: false
  },
});