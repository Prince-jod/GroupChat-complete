// Who is online?  We ask Socket.IO itself (works across many servers with Redis).
async function getOnlineUserIds(io, ignoreSocketId) {
  const sockets = await io.in("group").fetchSockets();
  const ids = new Set();
  for (const s of sockets) {
    if (s.id !== ignoreSocketId && s.data.user) ids.add(s.data.user.id);
  }
  return [...ids];
}

module.exports = function presenceHandler(io, socket) {
  // tell everybody (including this user) who is online now
  getOnlineUserIds(io).then((ids) => io.emit("online_users", ids));

  socket.on("disconnect", async () => {
    const ids = await getOnlineUserIds(io, socket.id);
    io.emit("online_users", ids);
  });

  // client can also ask for the list any time
  socket.on("get_online_users", async (ack) => {
    if (typeof ack === "function") ack(await getOnlineUserIds(io));
  });
};
