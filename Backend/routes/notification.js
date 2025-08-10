const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const { middleware} = require('../middlewares/authMiddleware');

router.post('/', notificationController.createNotification);
router.get('/', middleware, notificationController.getNotifications);
router.put('/status', notificationController.updateNotificationStatus);
router.put('/read/:notificationId', notificationController.markAsRead);
router.delete('/clear', middleware, notificationController.clearAllNotifications);

module.exports = router;