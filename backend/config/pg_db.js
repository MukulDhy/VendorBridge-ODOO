import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

// PostgreSQL Connection Pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/vendorbridge",
});

const runMigration = async () => {
  const client = await pool.connect();
  try {
    console.log("Running PostgreSQL migration for RFQ tables...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS rfqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_title VARCHAR(255) NOT NULL,
        description TEXT,
        items JSONB NOT NULL DEFAULT '[]',
        deadline TIMESTAMP NOT NULL,
        attachments TEXT[] DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
        created_by VARCHAR(255) NOT NULL, -- Storing MongoDB User ID as string for now
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rfq_vendors (
        rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
        vendor_id VARCHAR(255) NOT NULL, -- Storing MongoDB Vendor User ID as string
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (rfq_id, vendor_id)
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE NOT NULL,
        vendor_id VARCHAR(255) NOT NULL,
        pricing_details JSONB NOT NULL,
        delivery_timeline INTEGER,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'selected', 'rejected')),
        is_lowest_price BOOLEAN DEFAULT false,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_number VARCHAR(50) UNIQUE NOT NULL,
        rfq_id UUID REFERENCES rfqs(id) ON DELETE RESTRICT NOT NULL,
        quotation_id UUID REFERENCES quotations(id) ON DELETE RESTRICT NOT NULL,
        vendor_id VARCHAR(255) NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        approved_by VARCHAR(255),
        items JSONB NOT NULL,
        subtotal NUMERIC NOT NULL,
        tax_percentage NUMERIC DEFAULT 0,
        tax_amount NUMERIC NOT NULL,
        total_amount NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'invoiced')),
        remarks TEXT,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Migration successful: rfqs, rfq_vendors, quotations, and purchase_orders tables created.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
  }
};

// Run migration if this file is executed directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration().then(() => process.exit(0));
}

export default pool;
