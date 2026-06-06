import { Pool } from "pg";
import logger from "../utils/logger.js";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "vendorbridge",
  password: process.env.DB_PASSWORD || "12345678",
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL Connected Successfully");

    const result = await client.query("SELECT NOW()");
    console.log("Database Time:", result.rows[0].now);

    client.release();
  } catch (error) {
    console.error("❌ PostgreSQL Connection Error:", error.message);
  }
}

testConnection();

export default pool;
