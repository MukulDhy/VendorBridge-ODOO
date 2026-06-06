  import express from "express";
  import rateLimit from "express-rate-limit";
  import {
    register,
    login,
    logout,
    getMe,
    verifyEmail,
    verifyEmailCode,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshToken,
    checkEmail,   
  } from "../controllers/auth.controller.js";
  import { protect, requireEmailVerification } from "../middlewares/auth.js";

  const router = express.Router();

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
      success: false,
      message: "Too many attempts — please try again later",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
      success: false,
      message: "Too many attempts — please try again later",
    },
  });

  // Public
  router.post("/register", authLimiter, register);
  router.post("/login", authLimiter, login);
  router.post("/forgot-password", strictAuthLimiter, forgotPassword);
  router.post("/reset-password", strictAuthLimiter, resetPassword);
  router.post("/verify-email", verifyEmail);
  router.get("/verify-email/:token", verifyEmail);
  router.post("/verify-email-code", authLimiter, verifyEmailCode);
  router.post("/resend-verification", strictAuthLimiter, resendVerification);
  router.post("/refresh-token", refreshToken);
  router.get("/check-email", checkEmail);

  // Protected
  router.use(protect);
  router.post("/logout", logout);
  router.get("/me", getMe);
  router.put("/change-password", changePassword);

  // Example: route that requires verified email (for collabs, swipe, etc.)
  router.get("/me/verified", requireEmailVerification, (req, res) => {
    res.json({
      success: true,
      data: { user: req.user, message: "Email verified — full access" },
    });
  });

  export default router;
import express from "express";
import rateLimit from "express-rate-limit";
import { protect, requireVendor } from "../middlewares/auth.js";

// ── Controllers ───────────────────────────────────────────────
import { getMyRFQs, getRFQDetail } from "../controllers/vendorRFQ.controller.js";
import {
  submitQuotation,
  getMyQuotations,
  retractQuotation,
} from "../controllers/quotation.controller.js";
import {
  getMyPurchaseOrders,
  getPurchaseOrderDetail,
  updatePOStatus,
} from "../controllers/purchaseOrder.controller.js";
import {
  generateAndSendInvoice,
  getMyInvoices,
  getInvoiceHTML,
} from "../controllers/invoice.controller.js";

const router = express.Router();

// All vendor routes require a valid JWT + vendorId
router.use(protect, requireVendor);

// ── Rate limiters ─────────────────────────────────────────────
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many attempts — please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── RFQs ──────────────────────────────────────────────────────
router.get("/rfqs",          getMyRFQs);
router.get("/rfqs/:rfqId",   getRFQDetail);

// ── Quotations ────────────────────────────────────────────────
router.get("/quotations",            getMyQuotations);
router.post("/quotations", submitLimiter, submitQuotation);
router.delete("/quotations/:id",     retractQuotation);

// ── Purchase Orders ───────────────────────────────────────────
router.get("/purchase-orders",        getMyPurchaseOrders);
router.get("/purchase-orders/:id",    getPurchaseOrderDetail);
router.patch("/purchase-orders/:id/status", updatePOStatus);

// ── Invoices ──────────────────────────────────────────────────
router.get("/invoices",               getMyInvoices);
router.get("/invoices/:id/html",      getInvoiceHTML);
router.post("/purchase-orders/:poId/invoice", submitLimiter, generateAndSendInvoice);

export default router;