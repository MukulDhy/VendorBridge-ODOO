/**
 * user.repository.js
 *
 * All database operations for the `users` table.
 * Replaces every Mongoose method used in auth.controller.js:
 *   User.findOne()                    → findUserByEmail / findUserByEmailWithFields
 *   User.findById()                   → findUserById / findUserByIdWithPassword
 *   User.create()                     → createUser
 *   User.exists()                     → userExistsByEmail
 *   user.save()                       → updateUser  (patched fields via spread)
 *   user.comparePassword()            → comparePassword  (bcrypt, same logic)
 *   user.createEmailVerificationToken → createEmailVerificationToken
 *
 * Expected `users` table DDL (run once in your migration):
 * ─────────────────────────────────────────────────────────
 * CREATE TABLE users (
 *   id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name                            TEXT NOT NULL,
 *   email                           TEXT UNIQUE NOT NULL,
 *   password                        TEXT NOT NULL,
 *   role                            TEXT NOT NULL DEFAULT 'user',
 *   phone                           TEXT,
 *   profile_picture                 TEXT,
 *   is_email_verified               BOOLEAN NOT NULL DEFAULT FALSE,
 *   is_active                       BOOLEAN NOT NULL DEFAULT TRUE,
 *   profile_complete                BOOLEAN NOT NULL DEFAULT FALSE,
 *   last_login                      TIMESTAMPTZ,
 *   email_verification_token        TEXT,
 *   email_verification_expires      TIMESTAMPTZ,
 *   email_verification_otp          TEXT,
 *   email_verification_otp_expires  TIMESTAMPTZ,
 *   reset_password_otp              TEXT,
 *   reset_password_expires          TIMESTAMPTZ,
 *   reset_password_token            TEXT,
 *   created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool from "../config/pgDb.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Map snake_case DB row → camelCase object (matches old Mongoose doc shape).
 */
function toUser(row) {
  if (!row) return null;
  return {
    _id: row.id, // keep _id alias so controller code needs zero changes
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password, // only present when explicitly selected
    role: row.role,
    phone: row.phone,
    profilePicture: row.profile_picture,
    isEmailVerified: row.is_email_verified,
    isActive: row.is_active,
    profileComplete: row.profile_complete,
    lastLogin: row.last_login,
    emailVerificationToken: row.email_verification_token,
    emailVerificationExpires: row.email_verification_expires,
    emailVerificationOtp: row.email_verification_otp,
    emailVerificationOtpExpires: row.email_verification_otp_expires,
    resetPasswordOtp: row.reset_password_otp,
    resetPasswordExpires: row.reset_password_expires,
    resetPasswordToken: row.reset_password_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── finders ──────────────────────────────────────────────────────────────────

/**
 * Equivalent of: User.findOne({ email })
 * Returns public fields only (no password/tokens).
 */
export async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, name, email, role, phone, profile_picture,
            is_email_verified, is_active, profile_complete,
            last_login, created_at, updated_at
     FROM users WHERE email = $1`,
    [email]
  );
  return toUser(rows[0]);
}

/**
 * Equivalent of: User.findByEmail(email)  (the static that selected +password)
 * Used by login — includes password for comparison.
 */
export async function findUserByEmailWithPassword(email) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return toUser(rows[0]);
}

/**
 * Equivalent of: User.findById(id)
 */
export async function findUserById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, email, role, phone, profile_picture,
            is_email_verified, is_active, profile_complete,
            last_login, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return toUser(rows[0]);
}

/**
 * Equivalent of: User.findById(id).select('+password')
 */
export async function findUserByIdWithPassword(id) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return toUser(rows[0]);
}

/**
 * Equivalent of: User.findOne({ email }).select('+emailVerification* +resetPassword*')
 * Used by resendVerification, forgotPassword, resetPassword, verifyEmailCode.
 */
export async function findUserByEmailWithSensitiveFields(email) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return toUser(rows[0]);
}

/**
 * Equivalent of: User.findOne({ emailVerificationToken: hashed, emailVerificationExpires: { $gt: now } })
 */
export async function findUserByVerificationToken(hashedToken) {
  const { rows } = await pool.query(
    `SELECT * FROM users
     WHERE email_verification_token = $1
       AND email_verification_expires > NOW()`,
    [hashedToken]
  );
  return toUser(rows[0]);
}

/**
 * Equivalent of: User.exists({ email })
 */
export async function userExistsByEmail(email) {
  const { rows } = await pool.query(
    `SELECT 1 FROM users WHERE email = $1`,
    [email]
  );
  return rows.length > 0;
}

// ─── mutations ────────────────────────────────────────────────────────────────

/**
 * Equivalent of: User.create({ name, email, password, role, phone })
 * Hashes password before insert (mirrors Mongoose pre-save hook).
 */
export async function createUser(data) {
  const hashed = await bcrypt.hash(data.password, 12);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password, role, phone, is_email_verified)
     VALUES ($1, $2, $3, $4, $5, FALSE)
     RETURNING *`,
    [data.name, data.email, hashed, data.role ?? "user", data.phone ?? null]
  );
  return toUser(rows[0]);
}

/**
 * Generic patch — equivalent of user.save() after mutating fields.
 *
 * Pass only the fields that changed:
 *   await updateUser(user.id, { lastLogin: new Date() });
 *   await updateUser(user.id, { isEmailVerified: true, emailVerificationOtp: null });
 *
 * Supported camelCase keys (mirrors the Mongoose model):
 *   lastLogin, isEmailVerified, isActive, profileComplete,
 *   password (plain — will be hashed automatically),
 *   emailVerificationToken, emailVerificationExpires,
 *   emailVerificationOtp, emailVerificationOtpExpires,
 *   resetPasswordOtp, resetPasswordExpires, resetPasswordToken
 */
export async function updateUser(id, fields) {
  // Map camelCase → snake_case column names
  const columnMap = {
    lastLogin: "last_login",
    isEmailVerified: "is_email_verified",
    isActive: "is_active",
    profileComplete: "profile_complete",
    password: "password",
    emailVerificationToken: "email_verification_token",
    emailVerificationExpires: "email_verification_expires",
    emailVerificationOtp: "email_verification_otp",
    emailVerificationOtpExpires: "email_verification_otp_expires",
    resetPasswordOtp: "reset_password_otp",
    resetPasswordExpires: "reset_password_expires",
    resetPasswordToken: "reset_password_token",
    name: "name",
    phone: "phone",
    profilePicture: "profile_picture",
    role: "role",
  };

  const setClauses = [];
  const values = [];
  let i = 1;

  for (const [key, val] of Object.entries(fields)) {
    const col = columnMap[key];
    if (!col) continue;

    // Auto-hash plain password (mirrors Mongoose pre-save hook)
    if (key === "password") {
      values.push(await bcrypt.hash(val, 12));
    } else {
      values.push(val ?? null); // undefined → NULL
    }

    setClauses.push(`${col} = $${i++}`);
  }

  if (setClauses.length === 0) return null;

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE users SET ${setClauses.join(", ")}
     WHERE id = $${i}
     RETURNING *`,
    values
  );
  return toUser(rows[0]);
}

// ─── auth helpers ─────────────────────────────────────────────────────────────

/**
 * Equivalent of: user.comparePassword(password)
 */
export async function comparePassword(plainText, hashedPassword) {
  return bcrypt.compare(plainText, hashedPassword);
}

/**
 * Equivalent of: user.createEmailVerificationToken()
 * Returns { plainToken, hashedToken, expires }
 * Caller should persist hashedToken + expires via updateUser().
 */
export function createEmailVerificationToken() {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
  return { plainToken, hashedToken, expires };
}