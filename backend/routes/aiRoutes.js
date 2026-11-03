const express = require("express");
const { getSuggestions } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/suggestions", authMiddleware, getSuggestions);

module.exports = router;
