import { z, ZodError } from "zod";
import User from "../models/user.model.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  verifyEmailCodeSchema,
  changePasswordSchema,
} from "../validations/auth.validation.js";
import {
  sendVerificationEmail,
  sendPasswordResetOtp,
  sendWelcomeEmail,
  generateNumericOtp,
  hashToken,
  isSmtpReady,
} from "../services/authEmail.service.js";
import authRealtimeService from "../services/authRealtime.service.js";
import {
  signAccessToken,
  signRefreshToken,
  sendTokenCookie,
  clearTokenCookie,
} from "../utils/tokens.js";
import config from "../config/config.js";
import logger from "../utils/logger.js";

const zodEmail = z.string().email();

const formatZodErrors = (error) =>
  error.issues.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));

const buildAuthPayload = (user, accessToken, refreshToken) => ({
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    profilePicture: user.profilePicture,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    profileComplete: user.profileComplete,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  },
  accessToken,
  refreshToken,
});

// POST /api/v1/auth/register
export const register = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
        errorCode: 6,
      });
    }

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      phone: data.phone,
      isEmailVerified: false,
    });

    const plainToken = user.createEmailVerificationToken();
    const otp = generateNumericOtp();
    user.emailVerificationOtp = hashToken(otp);
    user.emailVerificationOtpExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    let emailSent = false;
    if (isSmtpReady()) {
      try {
        await sendVerificationEmail(user, plainToken, otp);
        emailSent = true;
      } catch (mailErr) {
        logger.error(`Verification email failed: ${mailErr.message}`);
      }
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    sendTokenCookie(res, accessToken);

    res.status(201).json({
      success: true,
      message: emailSent
        ? "Account created. Please check your email to verify your address."
        : "Account created. Email could not be sent — use resend verification when SMTP is configured.",
      data: {
        ...buildAuthPayload(user, accessToken, refreshToken),
        emailSent,
        verificationHint: emailSent ? undefined : "Configure SMTP_* in .env",
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(error),
        errorCode: 1,
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
        errorCode: 6,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
      errorCode: 2,
    });
  }
};

// POST /api/v1/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        errorCode: 7,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated",
        errorCode: 4,
      });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        errorCode: 7,
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    sendTokenCookie(res, accessToken);

    authRealtimeService.notifyLogin(user._id.toString(), {
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: user.isEmailVerified
        ? "Signed in successfully"
        : "Signed in. Please verify your email to unlock all features.",
      data: buildAuthPayload(user, accessToken, refreshToken),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(error),
        errorCode: 1,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
      errorCode: 2,
    });
  }
};

// POST /api/v1/auth/logout
export const logout = async (req, res) => {
  clearTokenCookie(res);
  if (req.user?._id) {
    authRealtimeService.notifyLogout(req.user._id.toString());
  }
  res.status(200).json({
    success: true,
    message: "Signed out successfully",
    data: null,
  });
};

// GET /api/v1/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

// GET /api/v1/auth/verify-email/:token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = verifyEmailSchema.parse({
      token: req.params.token || req.body?.token,
    });

    const hashed = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires +emailVerificationOtp +emailVerificationOtpExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
        errorCode: 1,
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    authRealtimeService.notifyEmailVerified(user._id.toString());

    try {
      if (isSmtpReady()) await sendWelcomeEmail(user);
    } catch (e) {
      logger.warn(`Welcome email failed: ${e.message}`);
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: { user: { id: user._id, email: user.email, isEmailVerified: true } },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(error),
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Verification failed",
    });
  }
};

// POST /api/v1/auth/verify-email-code
export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = verifyEmailCodeSchema.parse(req.body);

    const user = await User.findOne({ email }).select(
      "+emailVerificationOtp +emailVerificationOtpExpires"
    );

    if (
      !user ||
      !user.emailVerificationOtp ||
      user.emailVerificationOtpExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    const hashed = hashToken(code);
    if (user.emailVerificationOtp !== hashed) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    authRealtimeService.notifyEmailVerified(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: { user: { id: user._id, email: user.email, isEmailVerified: true } },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: formatZodErrors(error),
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/resend-verification
export const resendVerification = async (req, res) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);

    const user = await User.findOne({ email }).select(
      "+emailVerificationToken +emailVerificationExpires +emailVerificationOtp +emailVerificationOtpExpires"
    );

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email is registered, a verification message has been sent",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (!isSmtpReady()) {
      return res.status(503).json({
        success: false,
        message: "Email service is not configured. Set SMTP_* variables in .env",
      });
    }

    const plainToken = user.createEmailVerificationToken();
    const otp = generateNumericOtp();
    user.emailVerificationOtp = hashToken(otp);
    user.emailVerificationOtpExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail(user, plainToken, otp);

    res.status(200).json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: formatZodErrors(error),
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await User.findOne({ email }).select(
      "+resetPasswordOtp +resetPasswordExpires"
    );

    res.status(200).json({
      success: true,
      message: "If that email is registered, a reset code has been sent",
    });

    if (!user || !isSmtpReady()) return;

    const otp = generateNumericOtp();
    user.resetPasswordOtp = hashToken(otp);
    user.resetPasswordExpires = Date.now() + 5 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetOtp(user, otp);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: formatZodErrors(error),
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = resetPasswordSchema.parse(req.body);

    const user = await User.findOne({ email }).select(
      "+password +resetPasswordOtp +resetPasswordExpires"
    );

    if (
      !user ||
      !user.resetPasswordOtp ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    if (user.resetPasswordOtp !== hashToken(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;
    await user.save();

    authRealtimeService.notifyPasswordChanged(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Password reset successfully. You can sign in now.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: formatZodErrors(error),
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body
    );

    const user = await User.findById(req.user._id).select("+password");
    const match = await user.comparePassword(currentPassword);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
        errorCode: 7,
      });
    }

    user.password = newPassword;
    await user.save();

    authRealtimeService.notifyPasswordChanged(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: formatZodErrors(error),
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/auth/refresh-token
export const refreshToken = async (req, res) => {
  try {
    const token =
      req.body.refreshToken ||
      req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
        errorCode: 4,
      });
    }

    const { verifyRefreshToken } = await import("../utils/tokens.js");
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        errorCode: 4,
      });
    }

    const accessToken = signAccessToken(user);
    const newRefresh = signRefreshToken(user);
    sendTokenCookie(res, accessToken);

    res.status(200).json({
      success: true,
      data: { accessToken, refreshToken: newRefresh },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
      errorCode: 8,
    });
  }
};

// GET /api/v1/auth/check-email?email=
export const checkEmail = async (req, res) => {
  try {
    const email = zodEmail.parse(req.query.email);
    const exists = Boolean(await User.exists({ email }));
    res.status(200).json({
      success: true,
      data: { email, available: !exists },
    });
  } catch {
    res.status(400).json({
      success: false,
      message: "Valid email query parameter required",
    });
  }
};
