import express from "express";
import { createRFQ, getAllRFQs } from "../controllers/rfq.controller.js";
import { getQuotationsForRFQ, getQuotationComparison, selectQuotation } from "../controllers/quotation.controller.js";
import { protect, authorize } from "../middlewares/auth.js";
import { uploadMediaKit } from "../utils/uploadImage.js";

const router = express.Router();

router.route("/")
  .post(
    protect,
    authorize("procurement_officer", "admin"),
    uploadMediaKit.array("attachments", 5),
    createRFQ
  )
  .get(
    protect,
    authorize("procurement_officer", "admin"),
    getAllRFQs
  );

router.get(
  "/:rfqId/quotations",
  protect,
  authorize("procurement_officer", "admin"),
  getQuotationsForRFQ
);

router.get(
  "/:rfqId/quotations/compare",
  protect,
  authorize("procurement_officer", "admin"),
  getQuotationComparison
);

router.patch(
  "/:rfqId/quotations/:quotationId/select",
  protect,
  authorize("procurement_officer", "admin"),
  selectQuotation
);

export default router;
