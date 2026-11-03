// OPTIONAL: lets you run many backend servers and still have chat work across them.
// Turn it on by adding REDIS_URL to .env (example: redis://localhost:6379)
module.exports = async function attachRedisAdapter(io) {
  if (!process.env.REDIS_URL) return;

  try {
    const { createClient } = require("redis");
    const { createAdapter } = require("@socket.io/redis-adapter");

    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    pubClient.on("error", (e) => console.error("Redis error:", e.message));
    subClient.on("error", (e) => console.error("Redis error:", e.message));

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO Redis adapter enabled (ready to scale)");
  } catch (err) {
    console.error("Redis adapter failed, continuing without it:", err.message);
  }
};
