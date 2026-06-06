import { Pool, Client } from "pg";
import logger from "../utils/logger.js";
import { initDatabase } from "../db/createTables.js";

const DB_NAME = process.env.DB_NAME || "vendorbridge";

async function ensureDatabaseExists() {
  const client = new Client({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: "postgres",
    password: process.env.DB_PASSWORD || "12345678",
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );

    if (result.rowCount > 0) {
      logger.info(`Database '${DB_NAME}' already exists.`);
      return;
    }

    await client.query(`CREATE DATABASE "${DB_NAME}"`);

    logger.info(`Database '${DB_NAME}' created successfully.`);
  } catch (error) {
    logger.error(`Database creation error: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
}

// Create pool for actual application database
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: DB_NAME,
  password: process.env.DB_PASSWORD || "12345678",
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    const connection = await pool.connect();

    logger.info("✅ PostgreSQL Connected Successfully");

    const result = await connection.query("SELECT NOW()");
    logger.info(`Database Time: ${result.rows[0].now}`);

    connection.release();
  } catch (error) {
    logger.error(`❌ PostgreSQL Connection Error: ${error.message}`);
    throw error;
  }
}

async function initializePostgres() {
  try {
    await ensureDatabaseExists();
    await testConnection();
    await initDatabase(pool); // create tables here

    logger.info("✅ PostgreSQL initialization completed");
  } catch (error) {
    logger.error(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

await initializePostgres();

export default pool;