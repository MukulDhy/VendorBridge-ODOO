import logger from "../utils/logger.js";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const connectDB = async () => {
  try {
    await pool.query("SELECT NOW()");

    logger.info(
      `PostgreSQL Connected to ${process.env.DB_NAME}`
    );

    return pool;
  } catch (error) {
    logger.error(
      `PostgreSQL Connection Error: ${error.message}`
    );

    process.exit(1);
  }
};

export default connectDB;