import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Successfully connected to PostgreSQL! Server time:', res.rows[0].now);
  } catch (err: any) {
    console.error('Connection error:', err.stack);
  } finally {
    await pool.end();
  }
}

testConnection();

export default pool;