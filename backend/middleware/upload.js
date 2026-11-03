const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 10);

// images (no SVG - it can contain scripts), video, audio, pdf, text, office files
const ALLOWED = [
  /^image\/(png|jpe?g|gif|webp|bmp)$/,
  /^video\//,
  /^audio\//,
  /^application\/pdf$/,
  /^text\/plain$/,
  /^application\/(msword|vnd\.ms-excel|vnd\.ms-powerpoint)$/,
  /^application\/vnd\.openxmlformats-officedocument\./,
  /^application\/zip$/,
];

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    // random name so users can never overwrite each other's files
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 10);
    cb(null, crypto.randomBytes(16).toString("hex") + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.some((re) => re.test(file.mimetype))) return cb(null, true);
    cb(Object.assign(new Error("This file type is not allowed"), { status: 400 }));
  },
});

module.exports = upload;
