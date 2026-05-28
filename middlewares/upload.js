import multer from "multer";

// memoryStorage para Cloudinary (buffer en memoria)
const memoryStorage = multer.memoryStorage();
export const upload = multer({ storage: memoryStorage });

// diskStorage para subidas locales (si lo necesitás en otro lado)
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
export const uploadDisk = multer({ storage: diskStorage });