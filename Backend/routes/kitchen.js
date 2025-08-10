const express = require('express');
const kitchenController = require('../controllers/kitchen');
const router = express.Router();

router.get('/pending-order', kitchenController.pendingOrder),
router.get('/is-progress-order', kitchenController.getIsProgressOrders),
router.put('/accept-order/:orderId', kitchenController.isProgressOrder)
router.put('/deliver-order/:orderId', kitchenController.isDeliverOrder)

module.exports = router;