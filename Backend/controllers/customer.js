const models = require("../models");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const signup = async (req, res) => {
    const { name, phone } = req.body;

    try {
        const existingUser = await models.Customer.findOne({ phone: phone });

        let newUser;
        if (existingUser) {
            newUser = existingUser;
        } else {
            newUser = new models.Customer({
                name,
                phone,
            });
            await newUser.save();
        }

        const token = jwt.sign(
            { userId: newUser._id, phone: newUser.phone },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 1000,
            sameSite: "Strict",
        });

        res.status(200).json({
            success: true,
            message: existingUser ? "User logged in successfully" : "User signed up successfully",
            token: token,
            userId: newUser._id
        });
    } catch (error) {
        console.error("Error during user signup/login:", error);
        res.status(500).json({
            success: false,
            message: "Error signing up or logging in user",
            error: error.message,
        });
    }
};

const getAllCustomers = async (req, res) => {
    try {
        const customers = await models.Customer.find().select('name phone');
        res.status(200).json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({
            message: "Error fetching customers",
            error: error.message,
        });
    }
};


module.exports = { signup, getAllCustomers }   