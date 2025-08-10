const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
      customizations: [
        {
          title: String,
          option: String,
        },
      ],
      totalPrice: { type: Number },
    },
  ],
  totalAmount: { type: Number },
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: "Pending" },
});

OrderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "items.itemId",
    model: "Product",
  }).populate({
    path: "userId",
    model: "Customer",
  });
  next();
});

const Order =mongoose.models.Order || mongoose.model("Order", OrderSchema);

module.exports = Order;