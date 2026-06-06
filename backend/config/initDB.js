// config/initDB.js  — ADD these blocks inside your existing initializeDatabase()
// Paste after your existing quotations table creation.

import { pool } from "./db.js";

export const initializeDatabase = async () => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // ── existing tables (keep yours exactly as-is) ────────────

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name  VARCHAR(255) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone         VARCHAR(20),
        address       TEXT,
        category      VARCHAR(100),
        gst           VARCHAR(30),
        status        VARCHAR(20) DEFAULT 'Active'
                        CHECK (status IN ('Active','Inactive','Blacklisted')),
        rating        NUMERIC(3,1) DEFAULT 0,
        on_time_pct   INTEGER DEFAULT 0,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rfqs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_number  VARCHAR(50) UNIQUE NOT NULL,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        category    VARCHAR(100),
        quantity    INTEGER NOT NULL,
        unit        VARCHAR(50) DEFAULT 'units',
        deadline    TIMESTAMP NOT NULL,
        status      VARCHAR(20) DEFAULT 'open'
                      CHECK (status IN ('open','closed','cancelled','awarded')),
        created_by  UUID,           -- procurement officer's user _id (string from Mongo)
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rfq_vendors (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_id      UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
        vendor_id   UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(rfq_id, vendor_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_id        UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
        vendor_id     UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        price         NUMERIC(14,2) NOT NULL,
        delivery_days INTEGER NOT NULL,
        comments      TEXT,
        status        VARCHAR(30) DEFAULT 'submitted'
                        CHECK (status IN ('submitted','accepted','rejected')),
        submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(rfq_id, vendor_id)
      );
    `);

    // ── NEW: purchase_orders ──────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_number     VARCHAR(50) UNIQUE NOT NULL,
        rfq_id        UUID REFERENCES rfqs(id),
        quotation_id  UUID REFERENCES quotations(id),
        vendor_id     UUID NOT NULL REFERENCES vendors(id),
        created_by    UUID,           -- mongo user id (text)
        status        VARCHAR(30) DEFAULT 'pending'
                        CHECK (status IN (
                          'pending','approved','dispatched','delivered','cancelled'
                        )),
        delivery_date TIMESTAMP,
        notes         TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── NEW: po_items ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS po_items (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_id       UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        description VARCHAR(300) NOT NULL,
        quantity    INTEGER NOT NULL DEFAULT 1,
        unit_price  NUMERIC(14,2) NOT NULL,
        tax_pct     NUMERIC(5,2) DEFAULT 18.00,
        amount      NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
      );
    `);

    // ── NEW: invoices ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        po_id          UUID NOT NULL REFERENCES purchase_orders(id),
        vendor_id      UUID NOT NULL REFERENCES vendors(id),
        issued_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date       TIMESTAMP,
        subtotal       NUMERIC(14,2) NOT NULL,
        tax_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
        total          NUMERIC(14,2) NOT NULL,
        status         VARCHAR(20) DEFAULT 'unpaid'
                         CHECK (status IN ('unpaid','paid','overdue','cancelled')),
        notes          TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── indexes ───────────────────────────────────────────────
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_rfq_vendors_vendor ON rfq_vendors(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_quotations_vendor  ON quotations(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_po_vendor          ON purchase_orders(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_po        ON invoices(po_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_vendor    ON invoices(vendor_id);
    `);

    console.log("✅ Database initialized (including procurement tables)");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};