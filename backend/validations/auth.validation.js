import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Password must include uppercase, lowercase, number, and special character (@$!%*?&)"
  );

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(100, "Email cannot exceed 100 characters"),

  password: passwordSchema,

  role: z.enum(["brand", "influencer"], {
    errorMap: () => ({ message: 'Role must be either "brand" or "influencer"' }),
  }),

  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) =>
        !val ||
        /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)\.]/g, "")),
      "Please provide a valid phone number"
    ),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email"),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email"),
});

export const verifyEmailCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email"),
  code: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});
