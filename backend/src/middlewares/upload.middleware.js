"use strict";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/configCloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hyv-materiales",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto", fetch_format: "webp" },
    ],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
});

export default upload;
