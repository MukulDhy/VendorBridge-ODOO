
import logger from "../../utils/logger.js";

export async function createUsersTable(pool) {
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        name VARCHAR(50) NOT NULL,

        email VARCHAR(100) UNIQUE NOT NULL,

        password VARCHAR(255) NOT NULL,

        role VARCHAR(20) NOT NULL DEFAULT 'po'
          CHECK (role IN ('admin','po','manager','vendor')),

        phone VARCHAR(20),

        profile_picture TEXT DEFAULT 'https://static.vecteezy.com/system/resources/previews/054/078/735/non_2x/gamer-avatar-with-headphones-and-controller-vector.jpg',

        is_email_verified BOOLEAN DEFAULT FALSE,

        is_active BOOLEAN DEFAULT TRUE,

        profile_complete BOOLEAN DEFAULT FALSE,

        last_login TIMESTAMP,

        reset_password_token TEXT,

        reset_password_expires TIMESTAMP,

        email_verification_token TEXT,

        email_verification_expires TIMESTAMP,

        email_verification_otp TEXT,

        email_verification_otp_expires TIMESTAMP,

        reset_password_otp TEXT,

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

