const Message = require("../model/Message");
const User = require("../model/User");

const MEDIA_TYPES = ["image", "video", "audio", "file"];
const MAX_TEXT = 4000;

function fail(message) {
  return Object.assign(new Error(message), { status: 400 });
}

// Validate + save a message, return it with the sender's name.
async function createMessage({ senderId, receiverId = null, text = "", media = null }) {
  const cleanText = String(text || "").trim();

  if (cleanText.length > MAX_TEXT) throw fail("Message is too long");

  let mediaUrl = null;
  let mediaType = null;
  let mediaName = null;

  if (media) {
    // Only files uploaded through our own /api/upload are allowed
    if (!/^\/uploads\/[\w.-]+$/.test(String(media.url || ""))) throw fail("Invalid media");
    if (!MEDIA_TYPES.includes(media.type)) throw fail("Invalid media type");
    mediaUrl = media.url;
    mediaType = media.type;
    mediaName = String(media.name || "file").slice(0, 200);
  }

  if (!cleanText && !mediaUrl) throw fail("Message cannot be empty");

  if (receiverId !== null && receiverId !== undefined && receiverId !== "") {
    receiverId = Number(receiverId);
    if (!Number.isInteger(receiverId)) throw fail("Invalid receiver");
    if (receiverId === senderId) throw fail("You cannot message yourself");
    const receiver = await User.findByPk(receiverId, { attributes: ["id"] });
    if (!receiver) throw fail("Receiver not found");
  } else {
    receiverId = null;
  }

  const created = await Message.create({
    text: cleanText,
    userId: senderId,
    receiverId,
    mediaUrl,
    mediaType,
    mediaName,
  });

  const full = await Message.findByPk(created.id, {
    include: [{ model: User, attributes: ["id", "name"] }],
  });

  return full.toJSON();
}

// Send the saved message to the right Socket.IO rooms
function broadcast(io, msg) {
  if (msg.receiverId) {
    // personal message -> receiver's room + sender's room (so sender's other tabs update too)
    io.to(`user:${msg.receiverId}`).to(`user:${msg.userId}`).emit("private_message", msg);
  } else {
    io.to("group").emit("group_message", msg);
  }
}

module.exports = { createMessage, broadcast };
