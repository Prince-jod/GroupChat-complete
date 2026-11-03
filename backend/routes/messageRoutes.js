const express = require("express");
const {
sendMessage,
getMessages,
} = require("../controllers/messageController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Fetch previous messages
router.get("/", authMiddleware, getMessages);

// Send a new message
router.post("/", authMiddleware, sendMessage);

module.exports = router;
