const jwt = require("jsonwebtoken");
const User = require("../model/User");

// Runs once for every new socket connection.
// The client sends the JWT in:  io(url, { auth: { token } })
module.exports = async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId, { attributes: ["id", "name"] });
    if (!user) return next(new Error("User not found"));

    // socket.data is the safe place to keep per-connection info
    socket.data.user = { id: user.id, name: user.name };
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
};
