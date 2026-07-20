// Recibe archivos en memoria antes de validarlos.

import multer from "multer";
// Conserva el archivo en memoria hasta validar su contenido.
export const RecibirPlano = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
}).single("Plano");