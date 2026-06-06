import bcrypt from "bcryptjs";
import logger from "../utils/logger.js";

export async function initDatabase(pool) {
  try {
    logger.info("Initializing database tables...");

    // Drop tables to clean up old schemas and constraints
    await pool.query(`
      DROP TABLE IF EXISTS activity_logs CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS purchase_orders CASCADE;
      DROP TABLE IF EXISTS approvals CASCADE;
      DROP TABLE IF EXISTS quotations CASCADE;
      DROP TABLE IF EXISTS rfq_vendors CASCADE;
      DROP TABLE IF EXISTS rfqs CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS vendors CASCADE;
    `);

    // 1. Create EXTENSION
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 2. Create vendors
    await pool.query(`
      CREATE TABLE vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        gst_number VARCHAR(50) NOT NULL,
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
    logger.info("✅ Vendors table created");

    // 3. Create users
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'PROCUREMENT_OFFICER'
          CHECK (role IN ('ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER', 'VENDOR')),
        phone VARCHAR(20),
        vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
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
    logger.info("✅ Users table created");

    // 4. Create rfqs
    await pool.query(`
      CREATE TABLE rfqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        deadline TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Open', 'Closed', 'Awarded', 'Cancelled')),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        category VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info("✅ RFQs table created");

    // 5. Create rfq_vendors
    await pool.query(`
      CREATE TABLE rfq_vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        UNIQUE(rfq_id, vendor_id)
      );
    `);
    logger.info("✅ RFQ Vendors junction table created");

    // 6. Create quotations
    await pool.query(`
      CREATE TABLE quotations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
        price NUMERIC(12, 2) NOT NULL,
        delivery_days INTEGER NOT NULL,
        comments TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Shortlisted', 'Rejected', 'Awarded')),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(rfq_id, vendor_id)
      );
    `);
    logger.info("✅ Quotations table created");

    // 7. Create approvals
    await pool.query(`
      CREATE TABLE approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
        quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
        remarks TEXT,
        approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        decided_at TIMESTAMP
      );
    `);
    logger.info("✅ Approvals table created");

    // 8. Create purchase_orders
    await pool.query(`
      CREATE TABLE purchase_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL,
        quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
        vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
        items JSONB NOT NULL,
        tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
        status VARCHAR(50) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Delivered', 'Cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info("✅ Purchase Orders table created");

    // 9. Create invoices
    await pool.query(`
      CREATE TABLE invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
        vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
        amount NUMERIC(12, 2) NOT NULL,
        tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Overdue')),
        due_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info("✅ Invoices table created");

    // 10. Create notifications
    await pool.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info("✅ Notifications table created");

    // 11. Create activity_logs
    await pool.query(`
      CREATE TABLE activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id UUID NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info("✅ Activity Logs table created");

    // Seed database
    await seedDatabase(pool);

  } catch (error) {
    logger.error(`❌ Table creation failed: ${error.message}`);
    throw error;
  }
}

async function seedDatabase(pool) {
  try {
    logger.info("Seeding initial data...");

    // 1. Seed Vendors (d1-d7 prefix)
    const vSeeds = [
      { id: 'd1111111-1111-1111-1111-111111111111', name: 'Dell India Pvt Ltd', gst_number: '29ABCDE1234F2Z5', email: 'vendor@dell.com', phone: '+91 9876543210', address: 'Bengaluru, KA', category: 'Electronics', rating: 4.7, on_time: 95 },
      { id: 'd2222222-2222-2222-2222-222222222222', name: 'HP Enterprises', gst_number: '27ABCDE1234F1Z9', email: 'vendor@hp.com', phone: '+91 9876501234', address: 'Mumbai, MH', category: 'Electronics', rating: 4.4, on_time: 88 },
      { id: 'd3333333-3333-3333-3333-333333333333', name: 'Lenovo Solutions', gst_number: '07ABCDE5678F2Z1', email: 'sales@lenovo.com', phone: '+91 9000012345', address: 'Delhi, DL', category: 'Electronics', rating: 4.5, on_time: 92 },
      { id: 'd4444444-4444-4444-4444-444444444444', name: 'Godrej Interio', gst_number: '27GODRE1234F1Z2', email: 'supply@godrej.com', phone: '+91 9876123456', address: 'Pune, MH', category: 'Furniture', rating: 4.2, on_time: 84 },
      { id: 'd5555555-5555-5555-5555-555555555555', name: 'Reliance Office Supplies', gst_number: '27RELIA1234F1Z8', email: 'office@reliance.com', phone: '+91 9123456780', address: 'Mumbai, MH', category: 'Office Supplies', rating: 3.8, on_time: 76, status: 'Inactive' },
      { id: 'd6666666-6666-6666-6666-666666666666', name: 'Tata Steel Components', gst_number: '20TATAS1234F1Z3', email: 'raw@tatasteel.com', phone: '+91 9000098765', address: 'Jamshedpur, JH', category: 'Raw Materials', rating: 4.8, on_time: 97 },
      { id: 'd7777777-7777-7777-7777-777777777777', name: 'Infosys Software Licensing', gst_number: '29INFOS1234F1Z6', email: 'licensing@infosys.com', phone: '+91 9988776655', address: 'Bengaluru, KA', category: 'Software', rating: 2.4, on_time: 55, status: 'Blacklisted' }
    ];

    for (const v of vSeeds) {
      await pool.query(`
        INSERT INTO vendors (id, name, gst_number, email, phone, address, category, rating, on_time, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [v.id, v.name, v.gst_number, v.email, v.phone, v.address, v.category, v.rating, v.on_time, v.status ?? 'Active']);
    }
    logger.info("✅ Seeded vendors");

    // 2. Seed Users (a1-a5 prefix)
    const uSeeds = [
      { id: 'a1111111-1111-1111-1111-111111111111', name: 'Mukul Dahiya', email: 'admin@vendorbridge.io', role: 'ADMIN', password: 'admin123', is_email_verified: true },
      { id: 'a2222222-2222-2222-2222-222222222222', name: 'vishal', email: 'officer@vendorbridge.io', role: 'PROCUREMENT_OFFICER', password: 'officer123', is_email_verified: true },
      { id: 'a3333333-3333-3333-3333-333333333333', name: 'aksh', email: 'manager@vendorbridge.io', role: 'MANAGER', password: 'manager123', is_email_verified: true },
      { id: 'a4444444-4444-4444-4444-444444444444', name: 'Dell India Pvt Ltd', email: 'vendor@dell.com', role: 'VENDOR', password: 'vendor123', vendor_id: 'd1111111-1111-1111-1111-111111111111', is_email_verified: true },
      { id: 'a5555555-5555-5555-5555-555555555555', name: 'HP Enterprises', email: 'vendor@hp.com', role: 'VENDOR', password: 'vendor123', vendor_id: 'd2222222-2222-2222-2222-222222222222', is_email_verified: true }
    ];

    for (const u of uSeeds) {
      const hashedPw = await bcrypt.hash(u.password, 12);
      await pool.query(`
        INSERT INTO users (id, name, email, password, role, vendor_id, is_email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [u.id, u.name, u.email, hashedPw, u.role, u.vendor_id ?? null, u.is_email_verified]);
    }
    logger.info("✅ Seeded users");

    // 3. Seed RFQs (b1-b4 prefix)
    const rfqSeeds = [
      { id: 'b1111111-1111-1111-1111-111111111111', code: 'RFQ-2026-001', title: '100 Developer Laptops', description: 'i7, 16GB RAM, 512GB SSD, 14-inch', quantity: 100, deadline: new Date(Date.now() + 5 * 86400000), status: 'Open', created_by: 'a2222222-2222-2222-2222-222222222222', category: 'Electronics' },
      { id: 'b2222222-2222-2222-2222-222222222222', code: 'RFQ-2026-002', title: 'Ergonomic Office Chairs', description: 'Mesh back, adjustable arms, lumbar support', quantity: 60, deadline: new Date(Date.now() + 8 * 86400000), status: 'Open', created_by: 'a2222222-2222-2222-2222-222222222222', category: 'Furniture' },
      { id: 'b3333333-3333-3333-3333-333333333333', code: 'RFQ-2026-003', title: 'Annual Antivirus Licenses', description: 'Enterprise antivirus for 500 endpoints, 1 year', quantity: 500, deadline: new Date(Date.now() + 3 * 86400000), status: 'Closed', created_by: 'a2222222-2222-2222-2222-222222222222', category: 'Software' },
      { id: 'b4444444-4444-4444-4444-444444444444', code: 'RFQ-2026-004', title: 'MS Cold Rolled Steel Coils', description: 'Grade IS513, 1.2mm thickness, 20 tonnes', quantity: 20, deadline: new Date(Date.now() + 12 * 86400000), status: 'Awarded', created_by: 'a2222222-2222-2222-2222-222222222222', category: 'Raw Materials' }
    ];

    for (const r of rfqSeeds) {
      await pool.query(`
        INSERT INTO rfqs (id, code, title, description, quantity, deadline, status, created_by, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [r.id, r.code, r.title, r.description, r.quantity, r.deadline, r.status, r.created_by, r.category]);
    }
    logger.info("✅ Seeded rfqs");

    // 4. Seed RFQ Vendors relationships
    const rfqVendorSeeds = [
      { rfq_id: 'b1111111-1111-1111-1111-111111111111', vendor_id: 'd1111111-1111-1111-1111-111111111111' },
      { rfq_id: 'b1111111-1111-1111-1111-111111111111', vendor_id: 'd2222222-2222-2222-2222-222222222222' },
      { rfq_id: 'b1111111-1111-1111-1111-111111111111', vendor_id: 'd3333333-3333-3333-3333-333333333333' },
      { rfq_id: 'b2222222-2222-2222-2222-222222222222', vendor_id: 'd4444444-4444-4444-4444-444444444444' },
      { rfq_id: 'b2222222-2222-2222-2222-222222222222', vendor_id: 'd5555555-5555-5555-5555-555555555555' },
      { rfq_id: 'b4444444-4444-4444-4444-444444444444', vendor_id: 'd6666666-6666-6666-6666-666666666666' }
    ];

    for (const rv of rfqVendorSeeds) {
      await pool.query(`
        INSERT INTO rfq_vendors (rfq_id, vendor_id)
        VALUES ($1, $2)
      `, [rv.rfq_id, rv.vendor_id]);
    }
    logger.info("✅ Seeded rfq_vendors assignments");

    // 5. Seed Quotations (c1-c6 prefix)
    const qSeeds = [
      { id: 'c1111111-1111-1111-1111-111111111111', rfq_id: 'b1111111-1111-1111-1111-111111111111', vendor_id: 'd1111111-1111-1111-1111-111111111111', price: 65000, delivery_days: 10, comments: 'Includes 3-year warranty.', status: 'Submitted' },
      { id: 'c2222222-2222-2222-2222-222222222222', rfq_id: 'b1111111-1111-1111-1111-111111111111', vendor_id: 'd2222222-2222-2222-2222-222222222222', price: 63000, delivery_days: 15, comments: 'Bulk discount applied.', status: 'Submitted' },
      { id: 'c3333333-3333-3333-3333-333333333333', rfq_id: 'b1111111-1111-1111-1111-111111111111', vendor_id: 'd3333333-3333-3333-3333-333333333333', price: 64000, delivery_days: 8, comments: 'Free onsite setup.', status: 'Shortlisted' },
      { id: 'c4444444-4444-4444-4444-444444444444', rfq_id: 'b2222222-2222-2222-2222-222222222222', vendor_id: 'd4444444-4444-4444-4444-444444444444', price: 12500, delivery_days: 14, comments: '5-year warranty.', status: 'Submitted' },
      { id: 'c5555555-5555-5555-5555-555555555555', rfq_id: 'b2222222-2222-2222-2222-222222222222', vendor_id: 'd5555555-5555-5555-5555-555555555555', price: 11800, delivery_days: 21, comments: 'Standard 1-year warranty.', status: 'Submitted' },
      { id: 'c6666666-6666-6666-6666-666666666666', rfq_id: 'b4444444-4444-4444-4444-444444444444', vendor_id: 'd6666666-6666-6666-6666-666666666666', price: 78000, delivery_days: 12, comments: 'Includes transportation.', status: 'Awarded' }
    ];

    for (const q of qSeeds) {
      await pool.query(`
        INSERT INTO quotations (id, rfq_id, vendor_id, price, delivery_days, comments, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [q.id, q.rfq_id, q.vendor_id, q.price, q.delivery_days, q.comments, q.status]);
    }
    logger.info("✅ Seeded quotations");

    // 6. Seed Approvals (e1-e2 prefix)
    const approvalSeeds = [
      { id: 'e1111111-1111-1111-1111-111111111111', rfq_id: 'b1111111-1111-1111-1111-111111111111', quotation_id: 'c3333333-3333-3333-3333-333333333333', amount: 6400000, status: 'Pending', remarks: 'Lenovo selected on delivery + price balance.' },
      { id: 'e2222222-2222-2222-2222-222222222222', rfq_id: 'b4444444-4444-4444-4444-444444444444', quotation_id: 'c6666666-6666-6666-6666-666666666666', amount: 1560000, status: 'Approved', remarks: 'Approved by Manager.', approver_id: 'a3333333-3333-3333-3333-333333333333', decided_at: new Date() }
    ];

    for (const a of approvalSeeds) {
      await pool.query(`
        INSERT INTO approvals (id, rfq_id, quotation_id, amount, status, remarks, approver_id, decided_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [a.id, a.rfq_id, a.quotation_id, a.amount, a.status, a.remarks, a.approver_id ?? null, a.decided_at ?? null]);
    }
    logger.info("✅ Seeded approvals");

    // 7. Seed POs (f1 prefix)
    const poSeeds = [
      {
        id: 'f1111111-1111-1111-1111-111111111111',
        code: 'PO-2026-001',
        rfq_id: 'b4444444-4444-4444-4444-444444444444',
        quotation_id: 'c6666666-6666-6666-6666-666666666666',
        vendor_id: 'd6666666-6666-6666-6666-666666666666',
        items: JSON.stringify([{ name: 'MS Cold Rolled Steel Coils (1 tonne)', qty: 20, price: 78000 }]),
        tax_rate: 18,
        status: 'Delivered'
      }
    ];

    for (const po of poSeeds) {
      await pool.query(`
        INSERT INTO purchase_orders (id, code, rfq_id, quotation_id, vendor_id, items, tax_rate, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [po.id, po.code, po.rfq_id, po.quotation_id, po.vendor_id, po.items, po.tax_rate, po.status]);
    }
    logger.info("✅ Seeded purchase orders");

    // 8. Seed Invoices (f2 prefix)
    const invoiceSeeds = [
      {
        id: 'f2222222-2222-2222-2222-222222222222',
        code: 'INV-2026-001',
        po_id: 'f1111111-1111-1111-1111-111111111111',
        vendor_id: 'd6666666-6666-6666-6666-666666666666',
        amount: 1840800,
        tax_rate: 18,
        status: 'Paid',
        due_date: new Date(Date.now() + 15 * 86400000)
      }
    ];

    for (const inv of invoiceSeeds) {
      await pool.query(`
        INSERT INTO invoices (id, code, po_id, vendor_id, amount, tax_rate, status, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [inv.id, inv.code, inv.po_id, inv.vendor_id, inv.amount, inv.tax_rate, inv.status, inv.due_date]);
    }
    logger.info("✅ Seeded invoices");

    // 9. Seed Notifications
    const notificationSeeds = [
      { user_id: 'a3333333-3333-3333-3333-333333333333', title: 'Approval Required', message: 'RFQ-2026-001 awaiting your approval (₹64,00,000).', read: false, link: '/approvals' },
      { user_id: 'a2222222-2222-2222-2222-222222222222', title: 'Quotation Received', message: 'Lenovo submitted a quotation for RFQ-2026-001.', read: false, link: '/rfqs/b1111111-1111-1111-1111-111111111111' },
      { user_id: 'a4444444-4444-4444-4444-444444444444', title: 'New RFQ Assigned', message: "You've been invited to quote on RFQ-2026-001.", read: true, link: '/vendor/rfqs' }
    ];

    for (const n of notificationSeeds) {
      await pool.query(`
        INSERT INTO notifications (user_id, title, message, read, link)
        VALUES ($1, $2, $3, $4, $5)
      `, [n.user_id, n.title, n.message, n.read, n.link]);
    }
    logger.info("✅ Seeded notifications");

    // 10. Seed Activity Logs
    const logSeeds = [
      { user_id: 'a2222222-2222-2222-2222-222222222222', action: 'CREATE_RFQ', entity_type: 'RFQ', entity_id: 'b1111111-1111-1111-1111-111111111111' },
      { user_id: 'a4444444-4444-4444-4444-444444444444', action: 'SUBMIT_QUOTATION', entity_type: 'Quotation', entity_id: 'c1111111-1111-1111-1111-111111111111' },
      { user_id: 'a5555555-5555-5555-5555-555555555555', action: 'SUBMIT_QUOTATION', entity_type: 'Quotation', entity_id: 'c2222222-2222-2222-2222-222222222222' },
      { user_id: 'a3333333-3333-3333-3333-333333333333', action: 'APPROVE_RFQ', entity_type: 'Approval', entity_id: 'e2222222-2222-2222-2222-222222222222' },
      { user_id: 'a2222222-2222-2222-2222-222222222222', action: 'GENERATE_INVOICE', entity_type: 'Invoice', entity_id: 'f2222222-2222-2222-2222-222222222222' }
    ];

    for (const l of logSeeds) {
      await pool.query(`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
        VALUES ($1, $2, $3, $4)
      `, [l.user_id, l.action, l.entity_type, l.entity_id]);
    }
    logger.info("✅ Seeded activity logs");

  } catch (error) {
    logger.error(`❌ Seeding failed: ${error.message}`);
    throw error;
  }
}