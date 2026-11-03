const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// (the speed-up index for chats is created in config/migrate.js)
const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Message text (can be empty when only a file is sent)
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },

    // Sender
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // NULL  = group message
    // value = personal (private) message to that user
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Media sharing
    mediaUrl: { type: DataTypes.STRING, allowNull: true },
    mediaType: { type: DataTypes.STRING, allowNull: true }, // image | video | audio | file
    mediaName: { type: DataTypes.STRING, allowNull: true },
  }
);

module.exports = Message;
