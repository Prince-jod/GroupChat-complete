const express = require("express");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadFile } = require("../controllers/uploadController");

const router = express.Router();
router.post("/", authMiddleware, upload.single("file"), uploadFile);

module.exports = router;
