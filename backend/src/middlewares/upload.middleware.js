"use strict";
import multer from "multer";
import cloudinary from "../config/configCloudinary.js";

// Almacena el archivo en memoria (buffer)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de imagen no permitido"), false);
    }
  },
});

// Sube el buffer a Cloudinary y devuelve la URL
export const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "hyv-materiales",
        transformation: [
          { width: 800, height: 800, crop: "limit", quality: "auto", fetch_format: "webp" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

export default upload;
