const User = require("../model/User");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

const signup = async (req, res) => {
    try {
        const { name, identifier, password } = req.body;

        // Validate required fields
        if (!name?.trim() || !identifier?.trim() || !password) {
            return res.status(400).json({
                message: "Name, email/phone, and password are required"
            });
        }

        const value = identifier.trim();

        // Check whether identifier is an email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        // Separate email and phone
        const email = isEmail ? value.toLowerCase() : null;
        const phone = isEmail ? null : value;

        // Check whether email or phone is already registered
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    ...(email ? [{ email }] : []),
                    ...(phone ? [{ phone }] : [])
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email or phone number is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: name.trim(),
            email,
            phone,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone
            }
        });

    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Validate input
        if (!identifier?.trim() || !password) {
            return res.status(400).json({
                message: "Email/phone and password are required"
            });
        }

        const value = identifier.trim();

        // Check whether identifier is an email or phone
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        // Find user using email or phone
        const user = await User.findOne({
            where: isEmail
                ? { email: value.toLowerCase() }
                : { phone: value }
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email/phone or password"
            });
        }

        // Compare entered password with hashed password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email/phone or password"
            });
        }

        // Create JWT token
        const jwt = require("jsonwebtoken");

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
module.exports = { signup, login };

