const express = require('express');
const AdminController = require('../controllers/admin');
const multer = require('multer');
const upload = multer({ dest: "uploads/" });
const router = express.Router();
const { adminAuthMiddleware } = require('../middlewares/authMiddleware');

router.post('/register',AdminController.register);

router.post('/login',AdminController.login);

router.get('/', adminAuthMiddleware,AdminController.getAllAdmin);

router.get('/:id', adminAuthMiddleware,AdminController.getAdminById);

router.put('/update', adminAuthMiddleware, upload.single('profile_picture'), AdminController.updateAdmin);

router.post('/reset-password', adminAuthMiddleware,AdminController.resetPassword);

router.post('/forgot-password', adminAuthMiddleware, AdminController.forgotPassword);

router.post("/verify-otp", adminAuthMiddleware, AdminController.verifyOtp);

module.exports = router;