import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

// ✅ Configure Cloudinary
export const configCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  logger.info("✅ Cloudinary configured successfully");
};


export const upload = multer({
  dest: "uploads/Images/",
});


export const uploadImage = async (
  filePath,
  uploadLocal = false,
  options = {}
) => {
  try {
    // ✅ Upload file to Cloudinary
  } catch (error) {


  }
};