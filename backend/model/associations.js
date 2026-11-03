const User = require("./User");
const Message = require("./Message");

// Sender (the existing relation - messages come back as msg.User)
User.hasMany(Message, { foreignKey: "userId", onDelete: "CASCADE" });
Message.belongsTo(User, { foreignKey: "userId" });

// Receiver for personal messages (no DB foreign key, so old tables keep working)
Message.belongsTo(User, { as: "receiver", foreignKey: "receiverId", constraints: false });

module.exports = { User, Message };
