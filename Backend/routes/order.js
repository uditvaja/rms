
const express = require('express');
const orderController = require('../controllers/order');
const router = express.Router();

router.post('/', orderController.createOrder);

router.get('/:id', orderController.getOrder);

router.get('/recent/:id', orderController.getRecentOrder);

router.delete('/delete/:orderId', orderController.deleteItem)

module.exports = router;
