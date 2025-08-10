const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Customer",
      },
      items: [
        {
          itemId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Product" },
          quantity: { type: Number, required: true },
          totalPrice: { type: Number, required: true },
          customizations: [
            {
              _id: { type: mongoose.Schema.Types.ObjectId },
              title: { type: String },
              option: { type: String },
            },
          ],
        },
      ],
      paymentMethod: {
        type: String,
        enum: ["Online", "Cash", null],
        default: null,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      cgst: {
        type: Number,
        default: 0,
      },
      sgst: {
        type: Number,
        default: 0,
      },
      grandTotal: {
        type: Number,
        default: 0,
      },
      cookingRequest: {
        type: String,
        default: "make it best!",
      },
      status: {
        type: String,
        enum: ["Pending", "isProgress", "isDelivered"],
        default: "Pending",
      },
      orderDate: {
        type: Date,
        default: Date.now,
      },
      orderType: {
        type: String,
        enum: ["Onsite", "Parcel"],
        default: "Parcel",
        required: true,
      },
      orderAccepted: {
        type: Boolean,
        enum: [true, false],
        default: false,
      },
      paymentStatus: {
        type: String,
        enum: ["pending", "completed", "declined"],
        default: "pending"
      },
      paymentId: {
        type: String
      },
      paymentDate: {
        type: Date
      },
      startTime: {
        type: Date,
        default: null,
      },
      makingTime: {
        type: String,
        default: "00:00",
      },
      isDeleted: {
        type: Boolean, 
        default: false 
      }
});

orderSchema.pre(/^find/, function (next) {
  this.populate([
    {
      path: "items.itemId",
      model: "Product",
    },
    {
      path: "userId",
      model: "Customer",
    }
  ]);
  next();
});

module.exports = mongoose.models.PlacedOrder ||mongoose.model('PlacedOrder', orderSchema);
