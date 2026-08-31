import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';


const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 5432;
const database = process.env.DB_NAME;
const username = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD;

// Configuration du client postgres
const client = postgres({
  host,
  port,
  database,
  username,
  password,
});

// Initialisation de Drizzle ORM avec le schéma optionnel
export const db = drizzle({client});


(async () => {
  try {
    await client`SELECT 1`;
    console.log(`Connected successfully to PostgreSQL (${database}@${host}:${port})`);
  } catch (error) {
    console.error(`Failed to connect to  PostgreSQL :`, error);
  }
})();