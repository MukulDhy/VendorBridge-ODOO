/**
 * @file user.model.js
 * @description Mongoose schema for the User collection.
 *              Single collection for all 3 roles: brand | influencer | admin
 *              Follows the same pattern as the existing user model —
 *              bcrypt hashing, JWT generation, password reset, virtuals.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const { Schema } = mongoose;

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
      maxlength: [100, "Email cannot exceed 100 characters"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // never returned in queries by default
      validate: {
        validator: function (password) {
          // Skip re-validation on update (already hashed)
          if (!this.isModified("password")) return true;
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(
            password
          );
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      },
    },

    // ── Role ──────────────────────────────────────────────────────────────

    /**
     * Single field distinguishes all three portal types.
     * brand      → goes through BrandProfile setup
     * influencer → goes through InfluencerProfile setup
     * admin      → direct dashboard access
     */
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["admin", "procurement_officer", "manager","vendor"],
        message: 'Role must be one of: "admin", "procurement_officer", "manager", "vendor"',
        // values: ["admin", "po", "manager","vendor"],
        // message: 'Role must be one of: "admin", "po", "manager", "vendor"',
      },
      default: "procurement_officer",
      // default: "po",
    },

    // ── Contact ───────────────────────────────────────────────────────────

    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (phone) {
          if (!phone) return true;
          return /^[\+]?[1-9][\d]{0,15}$/.test(
            phone.replace(/[\s\-\(\)\.]/g, "")
          );
        },
        message: "Please provide a valid phone number",
      },
    },

    profilePicture: {
      type: String,
      default:
        "https://static.vecteezy.com/system/resources/previews/054/078/735/non_2x/gamer-avatar-with-headphones-and-controller-vector.jpg",
      validate: {
        validator: function (url) {
          if (!url) return true;
          return /^https?:\/\/[^\s]+$/.test(url);
        },
        message: "Please provide a valid image URL",
      },
    },

    // ── Account state ─────────────────────────────────────────────────────

    /**
     * True once the user clicks the email verification link.
     * Unverified accounts can register but cannot post collabs or swipe.
     */
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * True once the user completes all 5 steps of their setup flow.
     * Checked before allowing swipe / collab actions.
     */
    profileComplete: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },

    // ── Reset token ───────────────────────────────────────────────────────

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // ── Email verification token ──────────────────────────────────────────

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    /** 6-digit code (hashed) for manual verification in the app */
    emailVerificationOtp: {
      type: String,
      select: false,
    },

    emailVerificationOtpExpires: {
      type: Date,
      select: false,
    },

    /** Hashed 6-digit OTP for password reset */
    resetPasswordOtp: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Strip sensitive fields from every JSON response
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.emailVerificationOtp;
        delete ret.emailVerificationOtpExpires;
        delete ret.resetPasswordOtp;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ email: 1 });                // login lookup
userSchema.index({ role: 1 });                 // filter by role
userSchema.index({ role: 1, isActive: 1 });    // active users per role
userSchema.index({ createdAt: -1 });           // admin sort by newest

// ─── Pre-save: hash password ──────────────────────────────────────────────────

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Pre-save: update lastLogin on new doc ────────────────────────────────────

userSchema.pre("save", function (next) {
  if (this.isNew) {
    this.lastLogin = new Date();
  }
  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────

/**
 * @method comparePassword
 * @description Compare a plain-text password against the stored hash
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * @method generateToken
 * @description Generate a signed JWT for API authentication
 * @returns {string} JWT token string
 */
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      id:    this._id,
      email: this.email,
      role:  this.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

/**
 * @method createPasswordResetToken
 * @description Generate a password reset token, hash it for storage,
 *              set 10-minute expiry, and return the plain token for email.
 * @returns {string} Plain reset token (send via email)
 */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

/**
 * @method createEmailVerificationToken
 * @description Generate an email verification token with 24h expiry
 * @returns {string} Plain token (send via email)
 */
userSchema.methods.createEmailVerificationToken = function () {
  const verifyToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h

  return verifyToken;
};

/**
 * @method isPasswordResetTokenValid
 * @description Check whether the stored reset token is still within expiry
 * @returns {boolean}
 */
userSchema.methods.isPasswordResetTokenValid = function () {
  return (
    this.resetPasswordToken &&
    this.resetPasswordExpires &&
    this.resetPasswordExpires > Date.now()
  );
};

// ─── Virtuals ────────────────────────────────────────────────────────────────

/**
 * @virtual profileCompletion
 * @description Percentage of core profile fields filled in (0–100)
 */
userSchema.virtual("profileCompletion").get(function () {
  const fields = ["name", "email", "phone", "profilePicture", "role"];
  const filled = fields.filter((f) => {
    if (f === "profilePicture")
      return (
        this[f] &&
        !this[f].includes("gamer-avatar") // not still on default
      );
    return !!this[f];
  });
  return Math.round((filled.length / fields.length) * 100);
});

/**
 * @virtual displayRole
 * @description Human-readable role label
 * @returns 
 */
userSchema.virtual("displayRole").get(function () {
  const map = { brand: "Brand", influencer: "Influencer", admin: "Admin" };
  return map[this.role] || this.role;
});

/**
 * @virtual isSetupComplete
 * @description Alias for profileComplete — used by frontend guards
 */
userSchema.virtual("isSetupComplete").get(function () {
  return this.profileComplete;
});

// ─── Static methods ───────────────────────────────────────────────────────────

/**
 * @static findByEmail
 * @description Find a user by email and include password for auth checks
 * @param {string} email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select("+password");
};

/**
 * @static findActiveByRole
 * @description Get all active users of a specific role
 * @param {'brand'|'influencer'|'admin'} role
 * @returns {Promise<User[]>}
 */
userSchema.statics.findActiveByRole = function (role) {
  return this.find({ role, isActive: true });
};

const User = mongoose.model("User", userSchema);
export default User;