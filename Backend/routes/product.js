const express = require('express');
const productController = require('../controllers/product');
const upload = require('../middlewares/Multermiddleware');

const router = express.Router();

router.post('/add',upload.single('imageUrl'), productController.addProduct);

router.get('/getAllItems', productController.getAllProducts);

router.get('/items/:id', productController.getProduct)

router.put('/editItem/:id',upload.single('image'), productController.updateProduct)

router.delete('/deleteItem/:id' , productController.deleteProduct);

module.exports = router;