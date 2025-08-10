const express = require('express');
const placedOrderController = require('../controllers/placedOrder');
const paymentController = require('../controllers/payment');
const { adminAuthMiddleware, customerAuthMiddleware, middleware} = require('../middlewares/authMiddleware');
const router = express.Router();

// Order routes
router.post('/', placedOrderController.createPlacedOrder);

router.get('/:orderId', placedOrderController.getOrderById);
router.get('/orders/user/:userId', placedOrderController.getOrdersByUserId);
router.get('/orders/user/summary/:userId', placedOrderController.getUserOrderSummary);

router.get('/', placedOrderController.getAllPlacedOrders); //status: Pending

router.delete('/user/:userId/order/:orderId', placedOrderController.deletePlaceOrderByUserId);

// Quantity increment/decrement routes
router.patch('/order/:orderId/item/:itemId/increment', placedOrderController.incrementItemQuantity);
router.patch('/order/:orderId/item/:itemId/decrement', placedOrderController.decrementItemQuantity);

// Payment for Online
router.post('/initiate-payment', paymentController.initiatePayment);
router.post('/payment-callback', paymentController.handlePaymentCallback);

//Payment for Cash 
router.post('/cash-payment', paymentController.handleCashPayment);
router.post('/accept-cash-payment', adminAuthMiddleware,paymentController.acceptCashPayment);
router.post('/decline-cash-payment', adminAuthMiddleware,paymentController.declineCashPayment);

//Payment History 
router.get('/payment-history/onsite', placedOrderController.getOnsitePaymentHistory);
router.get('/payment-history/parcel', placedOrderController.getParcelPaymentHistory);


module.exports = router;

