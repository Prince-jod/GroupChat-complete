const { Op } = require("sequelize");
const Message = require("../model/Message");
const User = require("../model/User");
const { createMessage, broadcast } = require("../services/messageService");

// POST /api/messages - REST fallback (the chat UI uses Socket.IO "send_message")
const sendMessage = async (req, res) => {
  try {
    const msg = await createMessage({
      senderId: req.user.id,
      receiverId: req.body.receiverId,
      text: req.body.text,
      media: req.body.media,
    });

    const io = req.app.get("io");
    if (io) broadcast(io, msg);

    return res.status(201).json({ message: "Message saved successfully", data: msg });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error("Send message error:", error);
    return res.status(500).json({ message: "Failed to save message" });
  }
};

// GET /api/messages                       -> group chat
// GET /api/messages?with=5                -> personal chat with user 5
// Paging: ?limit=50&before=<messageId>    -> older messages
const getMessages = async (req, res) => {
  try {
    const me = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const withId = parseInt(req.query.with, 10);
    const before = parseInt(req.query.before, 10);

    const where = {};
    if (withId) {
      where[Op.or] = [
        { userId: me, receiverId: withId },
        { userId: withId, receiverId: me },
      ];
    } else {
      where.receiverId = null; // group messages (old messages have NULL too)
    }
    if (before) where.id = { [Op.lt]: before };

    const rows = await Message.findAll({
      where,
      include: [{ model: User, attributes: ["id", "name"] }],
      order: [["id", "DESC"]], // newest first, so LIMIT gives the latest ones
      limit,
    });

    rows.reverse(); // oldest -> newest for display

    return res.status(200).json({ data: rows, hasMore: rows.length === limit });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
};

module.exports = { sendMessage, getMessages };
