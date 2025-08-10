const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        default: "customer"
    }
    },
    { timestamps: true }
  );
const Customer = mongoose.models.User || mongoose.model('Customer', userSchema);
module.exports = Customer;