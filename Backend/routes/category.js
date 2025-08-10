const express = require('express');
const categoryController = require('../controllers/category');
const multer = require('multer');
const upload = multer({ dest: "uploads/" });
const { adminAuthMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/' ,upload.single('image'), adminAuthMiddleware, categoryController.createCategory);

router.get('/' , categoryController.getCategory);

module.exports = router;

