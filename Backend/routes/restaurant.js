const express = require('express');
const resturantController = require('../controllers/restaurant');

const router = express.Router();

router.post('/', resturantController.createRestaurant);

router.get('/', resturantController.getRestaurant);

module.exports = router;