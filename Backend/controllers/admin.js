const jwt = require('jsonwebtoken');
const models = require("../models");
const bcrypt = require('bcryptjs')
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const register = async (req, res) => {
  try {
      const { firstname, lastname, email, phonenumber, country, state, city, selectrestaurant, password, comfirmpassword } = req.body;

      if (!firstname || !lastname || !email || !phonenumber || !country || !state || !city || !selectrestaurant || !password || !comfirmpassword) {
          return res.status(400).send({
              success: false,
              message: 'Please provide all fields'
          });
      }

      if (password !== comfirmpassword) {
          return res.status(400).send({
              success: false,
              message: 'Password and confirm password do not match'
          });
      }

      const existingAdmin = await models.Admin.findOne({ email });
      if (existingAdmin) {
          return res.status(400).send({
              success: false,
              message: 'Email already registered, please login'
          });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const adminUser = await models.Admin.create({
          firstname,
          lastname,
          email,
          phonenumber,
          country,
          state,
          city,
          selectrestaurant,
          password: hashedPassword,
      });

      res.status(201).send({
          success: true,
          message: 'Successfully admin registered'
      });

  } catch (error) {
      console.log("Error in admincontroller register API", error);
      res.status(500).send({
          success: false,
          message: "Error in admin controller register data API",
      });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(500).send({
        success: false,
        message: 'Please provide email or password'
      });
    }
    const admin = await models.Admin.findOne({ email });
    if (!admin) {
      return res.status(404).send({
        success: false,
        message: 'Admin is not found'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(500).send({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.jwt_secret,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
      sameSite: "Strict",
    });

    res.status(200).send({
      success: true,
      message: 'Login successfully',
      token,
      adminId: admin._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: 'Error in admin login api',
      error
    });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }

  try {
    const user = await models.Admin.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.resetOtp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error in verifyOtpController:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const getAllAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const allAdmins = await models.Admin.find({});

    if (!allAdmins || allAdmins.length === 0) {
      return res.status(404).json({ success: false, message: 'No admin data found' });
    }

    res.status(200).json({ success: true, data: allAdmins });
  } catch (error) {
    console.error("Error in getAllAdmin controller:", error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAdminById = async (req, res) => {
  try {
    const adminId = req.params.id;
    const admin = await models.Admin.findById(adminId);
    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    console.error("Error in getAdminById controller:", error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const adminId = req.user.id; 
    const {
        firstname,
        lastname,
        email,
        phonenumber,
        selectrestaurant,
        city,
        state,
        country,
        newPassword
    } = req.body; 

    let imageUrl = req.body.profile_picture; 

    const updateData = {
        firstname,
        lastname,
        email,
        phonenumber,
        selectrestaurant,
        city,
        state,
        country,
        profile_picture: imageUrl,
    };

    if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateData.password = hashedPassword;
    }

    const updatedAdmin = await models.Admin.findByIdAndUpdate(
        adminId,
        updateData,
        { new: true } 
    );

    if (!updatedAdmin) {
        return res
            .status(404)
            .json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({
        success: true,
        message: "Admin data updated successfully",
        data: updatedAdmin,
    });
  } catch (error) {
    console.error("Error in updateAdminController:", error);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
  }
};

const resetPassword = async (req, res) => {
  const { id, oldPassword, newPassword } = req.body;

  if (!id || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing required fields: id, oldPassword, and newPassword must be provided.' });
  }

  try {
    const user = await models.Admin.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await models.Admin.findOne({ email });

  if (!user) {
    return res.status(404).json({ errors: [{ msg: 'User not found' }] });
  }

  // Generate Reset Token
  const token = crypto.randomBytes(20).toString('hex');

  // Set token and expiration (e.g., 1 hour)
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000;

  // Generate OTP (4-6 digits)
  const otp = crypto.randomInt(100000, 999999).toString();

  // Save OTP and expiration (5 minutes)
  user.resetOtp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes expiration
  await user.save();

  const resetLink = `http://${req.headers.host}/Change_pass/${token}`;
  
  // Send OTP to user's email
  const mailOptions = {
    from: 'harahrathod1432@gmail.com',
    to: user.email,
    subject: 'Your OTP for Password Reset',
    text: `Your OTP is ${otp}.\n` +
          `You are receiving this email because you (or someone else) requested a password reset for your account.\n\n` +
          `Please click the following link, or paste it into your browser to complete the process:\n\n` +
          `${resetLink}\n`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error sending email' });
    } else {
      console.log('OTP sent: ' + info.response);
    }
  });

  console.log(`Generated OTP for ${user.email}: ${otp}`);

  // Respond with success message or redirect as needed
  res.status(200).json({ message: 'OTP sent successfully' });
};

module.exports = { register, login ,getAllAdmin, getAdminById, forgotPassword, verifyOtp, updateAdmin, resetPassword};