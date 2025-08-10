const express = require('express');
const dashboardController = require('../controllers/dashboard');
const { adminAuthMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/counts', adminAuthMiddleware, dashboardController.getCounts);
router.get('/order-counts', adminAuthMiddleware, dashboardController.countOrdersByType);
router.get('/counts/date',  adminAuthMiddleware, dashboardController.customerVisit);
router.get('/popular-dishes',  adminAuthMiddleware, dashboardController.getPopularDishes);

module.exports = router;