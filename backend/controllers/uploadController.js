// POST /api/upload  (form-data field name: "file")
const uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const mime = req.file.mimetype;
  let type = "file";
  if (mime.startsWith("image/")) type = "image";
  else if (mime.startsWith("video/")) type = "video";
  else if (mime.startsWith("audio/")) type = "audio";

  // browsers send non-English file names as latin1 -> convert back to utf8
  const name = Buffer.from(req.file.originalname, "latin1").toString("utf8");

  return res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    type,
    name,
    size: req.file.size,
  });
};

module.exports = { uploadFile };
