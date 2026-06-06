import crypto from "crypto";
import sendMail from "../utils/sendMail.js";
import config from "../config/config.js";
import logger from "../utils/logger.js";

let smtpVerified = false;

export const verifySmtpConnection = async () => {
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: parseInt(config.SMTP_PORT, 10),
      secure: parseInt(config.SMTP_PORT, 10) === 465,
      service: config.SMTP_SERVICE,
      auth: {
        user: config.SMTP_MAIL,
        pass: config.SMTP_PASSWORD,
      },
    });
    await transporter.verify();
    smtpVerified = true;
    logger.info("SMTP connection verified — emails are ready to send");
    return true;
  } catch (err) {
    smtpVerified = false;
    logger.warn(`SMTP not configured or unreachable: ${err.message}`);
    return false;
  }
};

export const isSmtpReady = () => smtpVerified;

/** Short code shown in email (first 6 chars of token, uppercase) */
export const formatVerificationCode = (plainToken) =>
  plainToken.slice(0, 6).toUpperCase();

export const generateNumericOtp = () =>
  String(crypto.randomInt(100000, 999999));

export const hashToken = (plain) =>
  crypto.createHash("sha256").update(plain).digest("hex");

export const sendVerificationEmail = async (user, plainToken, otp) => {
  const verifyUrl = `${config.CLIENT_URL}/verify-email?token=${plainToken}`;
  const verificationCode = otp || formatVerificationCode(plainToken);

  await sendMail({
    email: user.email,
    subject: "Verify your Inflio account",
    template: "inflio_verify_email.ejs",
    data: {
      user: {
        name: user.name,
        role: user.displayRole || user.role,
      },
      verifyUrl,
      verificationCode,
    },
  });
};

export const sendPasswordResetOtp = async (user, otp) => {
  await sendMail({
    email: user.email,
    subject: "Inflio — Password reset code",
    template: "forgot_mail.ejs",
    data: { user: { name: user.name }, otp },
  });
};

export const sendWelcomeEmail = async (user) => {
  await sendMail({
    email: user.email,
    subject: "Welcome to Inflio",
    template: "welcome_mail.ejs",
    data: { user: { name: user.name, role: user.role } },
  });
};
