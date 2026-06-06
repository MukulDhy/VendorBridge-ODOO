import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

export const configCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info("✅ Cloudinary configured successfully");
};

// ─── Multer instances ────────────────────────────────────────────────────────

// Generic image uploader (5 MB) — used for influencer photo & brand logo
export const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only image files are allowed"));
  },
});

// Media kit uploader (15 MB) — accepts PDFs, images, docs, slides
export const uploadMediaKit = multer({
  dest: "uploads/",
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (/^image\//.test(file.mimetype) || allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("Unsupported file type for media kit"));
  },
});

// ─── Cloudinary helpers ──────────────────────────────────────────────────────

const safeUnlink = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    logger.warn(`Failed to remove temp file ${filePath}: ${err.message}`);
  }
};

/**
 * Upload a local file to Cloudinary and remove the temp file afterwards.
 *
 * @param {string} filePath - Local path produced by multer (req.file.path)
 * @param {object} [options]
 * @param {string} [options.folder]        - Cloudinary folder (default: "uploads")
 * @param {"image"|"raw"|"auto"|"video"} [options.resourceType] - default "image"
 * @param {string} [options.publicId]      - Optional explicit public_id
 * @returns {Promise<{ url: string, publicId: string, resourceType: string, originalName?: string }>}
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  const {
    folder = "uploads",
    resourceType = "image",
    publicId,
  } = options;

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
      ...(publicId ? { public_id: publicId } : {}),
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      originalName: path.basename(filePath),
    };
  } catch (error) {
    logger.error(`❌ Cloudinary upload failed: ${error.message}`);
    throw new Error("Failed to upload file to Cloudinary");
  } finally {
    safeUnlink(filePath);
  }
};

/**
 * Delete an asset from Cloudinary by public_id.
 *
 * @param {string} publicId
 * @param {"image"|"raw"|"video"} [resourceType] - default "image"
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    logger.warn(
      `Failed to delete Cloudinary asset ${publicId}: ${error.message}`
    );
    return null;
  }
};

// ─── Backwards-compatible alias for any existing callers ─────────────────────
export const uploadImage = async (imagePath) =>
  uploadToCloudinary(imagePath, { folder: "screenshots", resourceType: "image" });
