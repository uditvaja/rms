const models = require("../models");

const createRestaurant = async (req, res) => {
    try {
        const { restaurantName, restaurantAddress, country, state, city, zipCode } = req.body;
    
        if (!restaurantName || !restaurantAddress || !country || !state || !city || !zipCode) {
          return res.status(400).json({
            success: false,
            message: 'All fields are required',
          });
        }

        const newRestaurant = new models.Restaurant({
          restaurantName,
          restaurantAddress,
          country,
          state,
          city,
          zipCode,
        });
    
        await newRestaurant.save();
    
        res.status(201).json({
          success: true,
          message: 'Restaurant created successfully',
          data: newRestaurant,
        });
      } catch (err) {
        console.error('Error creating restaurant:', err);
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          error: err.message,
        });
      }
  };

  const getRestaurant = async (req, res) => {
    console.log('GET /getRestaurant endpoint hit');
    try {
      const restaurants = await models.Restaurant.find();
      res.status(200).json(restaurants);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      res.status(500).json({ message: 'Error fetching restaurants' });
    }
  };
  
module.exports = { createRestaurant , getRestaurant};