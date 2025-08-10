const mongoose = require("mongoose");

// Define Customization Schema
const CustomizationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  selection: {
    type: String,
    enum: ["multiple", "single"],
    required: true,
  },
  options: [
    {
      name: { type: String, required: true },
      detail: { type: String },
      extraRate: { type: Number, default: 0 },
    },
  ],
});

// Define Item Schema
const productSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
  },
  ingredients: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    enum: ["Spicy", "Sweet"],
    required: true,
  },
  spiceLevel: {
    type: String,
    enum: ["Less Spicy", "Regular Spicy", "Extra Spicy"],
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  availability: {
    type: String,
    required: false,
    enum: ['available', 'unavailable'],
    default: 'available'
  },
  itemType: {
    type: String,
    required: true,
    enum: ["veg", "nonveg"],
  },
  customizations: [CustomizationSchema], // Embed customizations
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Category'
  },
});

module.exports =mongoose.models.Product || mongoose.model("Product", productSchema);