const { Server } = require("socket.io");
const socketAuth = require("./middleware");
const attachRedisAdapter = require("./redisAdapter");
const chatHandler = require("./handlers/chat");
const presenceHandler = require("./handlers/presence");

async function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  await attachRedisAdapter(io);

  // 1) Socket authentication (JWT)
  io.use(socketAuth);

  // 2) Every connected + authenticated user
  io.on("connection", (socket) => {
    const me = socket.data.user;
    console.log(`Socket connected: ${me.name} (${socket.id})`);

    // 3) Join rooms
    socket.join("group");          // everyone is in the group chat
    socket.join(`user:${me.id}`);  // personal room -> used for private messages

    chatHandler(io, socket);
    presenceHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${me.name} (${socket.id})`);
    });
  });

  return io;
}

module.exports = initSocket;
