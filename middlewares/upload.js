import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) +
      "-" + file.originalname;

    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
});

export const uploadDisk = multer({
  storage,
});