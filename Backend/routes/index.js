const express = require('express');
const router = express.Router();

// admin
router.use("/admin",require('./admin'));
router.use("/restaurant",require('./restaurant'));
router.use("/product", require('./product'));
router.use('/category', require('./category'));
router.use('/qr-code', require('./qrCode'));
router.use('/dashboard', require('./dashboard'));

// customer
router.use('/customer', require('./customer'));
router.use('/add-to-cart-order' , require('./order'));
router.use('/place-order' , require('./placedOrder'));

router.use('/kitchen', require('./kitchen'));
router.use('/notifications', require('./notification'));

module.exports = router; 

