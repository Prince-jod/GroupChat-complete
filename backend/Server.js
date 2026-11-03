require("dotenv").config();

const http = require("http");
const path = require("path");
const express = require("express");
const cors = require("cors");

const sequelize = require("./config/db");
require("./model/User");
require("./model/Message");
require("./model/associations");
const migrateMessages = require("./config/migrate");

const initSocket = require("./socket-io");

const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const aiRoutes = require("./routes/aiRoutes");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Uploaded images/videos/files are served from here
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("Group Chat Backend is running!");
});

// Handles upload errors (file too big, wrong type, ...)
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File is too large" });
  }
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// Express app -> HTTP server -> Socket.IO
const server = http.createServer(app);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected successfully!");

    await sequelize.sync();
    await migrateMessages();
    console.log("Database tables synchronized!");

    const io = await initSocket(server);
    app.set("io", io); // so REST controllers can broadcast too

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start failed:", error);
  }
}

startServer();
