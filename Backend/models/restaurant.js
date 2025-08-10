const mongoose = require('mongoose');

const createnewresturantSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: [true, "Restaurant name is required"],
    },
    restaurantAddress: {
      type: String,
      required: [true, "Restaurant address is required"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    zipCode: {
      type: String,
      required: [true, "Zip code is required"],
    },
  },
  { timestamps: true }
);

const Restaurant = mongoose.models.Restaurant ||  mongoose.model('Restaurant', createnewresturantSchema);
module.exports = Restaurant;