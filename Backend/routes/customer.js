const express = require('express');
const cutomerController = require('../controllers/customer');
const { customerAuthMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/userSignup', cutomerController.signup);

router.get('/', cutomerController.getAllCustomers);

module.exports = router;