const { createMessage, broadcast } = require("../../services/messageService");

module.exports = function chatHandler(io, socket) {
  const me = socket.data.user;

  // very small anti-spam: max 20 messages per 10 seconds per connection
  let windowStart = Date.now();
  let count = 0;
  function allowed() {
    const now = Date.now();
    if (now - windowStart > 10000) {
      windowStart = now;
      count = 0;
    }
    return ++count <= 20;
  }

  // payload: { receiverId?: number, text?: string, media?: {url,type,name} }
  socket.on("send_message", async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    try {
      if (!allowed()) return reply({ ok: false, error: "You are sending too fast" });

      const msg = await createMessage({
        senderId: me.id,
        receiverId: payload?.receiverId ?? null,
        text: payload?.text,
        media: payload?.media || null,
      });

      broadcast(io, msg);
      reply({ ok: true, id: msg.id });
    } catch (err) {
      if (!err.status) console.error("send_message error:", err);
      reply({ ok: false, error: err.status ? err.message : "Could not send message" });
    }
  });

  // "Alice is typing..."  payload: { receiverId?: number, isTyping: boolean }
  socket.on("typing", (payload) => {
    const data = { userId: me.id, name: me.name, isTyping: !!payload?.isTyping };

    if (payload?.receiverId) {
      io.to(`user:${Number(payload.receiverId)}`).emit("typing", { ...data, group: false });
    } else {
      socket.to("group").emit("typing", { ...data, group: true });
    }
  });
};
