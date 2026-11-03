const { DataTypes } = require("sequelize");
const sequelize = require("./db");
const Message = require("../model/Message");

// sequelize.sync() does NOT add new columns to an existing table.
// This small helper adds the new chat columns safely, only if they are missing.
async function migrateMessages() {
  const qi = sequelize.getQueryInterface();
  const table = Message.getTableName();
  const cols = await qi.describeTable(table);

  const wanted = {
    receiverId: { type: DataTypes.INTEGER, allowNull: true },
    mediaUrl: { type: DataTypes.STRING, allowNull: true },
    mediaType: { type: DataTypes.STRING, allowNull: true },
    mediaName: { type: DataTypes.STRING, allowNull: true },
  };

  for (const [name, def] of Object.entries(wanted)) {
    if (!cols[name]) {
      await qi.addColumn(table, name, def);
      console.log(`Migration: added column ${name}`);
    }
  }

  const indexes = await qi.showIndex(table);
  if (!indexes.some((i) => i.name === "messages_conversation_idx")) {
    await qi.addIndex(table, ["receiverId", "userId", "id"], {
      name: "messages_conversation_idx",
    });
    console.log("Migration: added messages_conversation_idx");
  }
}

module.exports = migrateMessages;
