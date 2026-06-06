
import logger from "../../utils/logger.js";

export async function createUsersTable(pool) {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  gst VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  category VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Blacklisted')),
  rating NUMERIC(3, 2) DEFAULT 4.0,
  on_time INTEGER DEFAULT 90,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
    `);

    logger.info("✅ Users table ready");
  } catch (error) {
    logger.error(`❌ Users table creation failed: ${error.message}`);
    throw error;
  }
}

