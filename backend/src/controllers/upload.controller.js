"use strict";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import upload from "../middlewares/upload.middleware.js";

export async function uploadImage(req, res) {
  // Envolver multer en una promesa para capturar sus errores correctamente
  const runUpload = () =>
    new Promise((resolve, reject) => {
      upload.single("image")(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  try {
    await runUpload();

    if (!req.file) {
      return handleErrorClient(res, 400, "No se recibió ninguna imagen");
    }

    // multer-storage-cloudinary ya subió el archivo a Cloudinary
    // La URL segura queda en req.file.path
    const imageUrl = req.file.path;

    handleSuccess(res, 200, "Imagen subida correctamente", { imageUrl });
  } catch (error) {
    console.error("Error al subir imagen a Cloudinary:", error);

    if (error.code === "LIMIT_FILE_SIZE") {
      return handleErrorClient(res, 400, "La imagen supera el límite de 5 MB");
    }
    if (error.http_code) {
      // Error de la API de Cloudinary
      return handleErrorClient(res, 400, `Error de Cloudinary: ${error.message}`);
    }

    handleErrorServer(res, 500, error.message || "Error interno al subir la imagen");
  }
}
