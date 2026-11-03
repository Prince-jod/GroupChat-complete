const { Op } = require("sequelize");
const User = require("../model/User");

// GET /api/users - everybody except me (for the personal chat list)
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { id: { [Op.ne]: req.user.id } },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
    return res.status(200).json({ data: users });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

module.exports = { getUsers };
