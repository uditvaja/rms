const models = require("../models");
// const Notification = require('../models/notification');
// const { getIO } = require('../socketUtil');

// Create a new order
// const createPlacedOrder = async (req, res) => {
//   try {
//       console.log("Request body received:", req.body);
  
//       const { userId, items, cookingRequest, paymentType, orderType } = req.body;
  
//       if (!userId || !items || items.length === 0) {
//         return res.status(400).json({ message: "UserId and items are required" });
//       }

//       const totalAmount = items.reduce((sum, item) => {
//           if (typeof item.totalPrice !== 'number' || isNaN(item.totalPrice)) {
//               throw new Error(`Invalid totalPrice for item: ${item.itemId}`);
//           }
//           return sum + (item.quantity * item.totalPrice);
//       }, 0);

//       const newOrder = new models.PlacedOrder({
//         userId,
//         items,
//         paymentMethod: null,
//         totalAmount,
//         cookingRequest: cookingRequest || null,
//         paymentStatus: 'pending',
//         orderType: orderType || 'Parcel'
//       });

//       const savedOrder = await newOrder.save();

//       if (paymentType) {
//           const paymentMethod = paymentType === 'cash' ? 'Cash' : 'Online';
//           savedOrder.paymentMethod = paymentMethod;
          
//           // If it's a cash payment, emit socket event
//           if (paymentMethod === 'Cash' && global.io) {
//               global.io.emit('newCashPayment', {
//                   orderId: savedOrder._id,
//                   amount: savedOrder.totalAmount,
//                   customerName: savedOrder.userId?.name
//               });
//           }
          
//           await savedOrder.save();
//       }
  
//       res.status(201).json({
//         message: "Order created successfully",
//         order: savedOrder,
//       });
//   } catch (error) {
//       console.error("Error creating order:", error);
  
//       res.status(500).json({
//         message: "Failed to create order",
//         error: error.message,
//       });
//   }
// };

const createPlacedOrder = async (req, res) => {
  try {

    const { userId, items, cookingRequest, paymentType, orderType } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ message: "UserId and items are required" });
    }

    const totalAmount = items.reduce((sum, item) => {
      if (typeof item.totalPrice !== 'number' || isNaN(item.totalPrice)) {
        throw new Error(`Invalid totalPrice for item: ${item.itemId}`);
      }
      return sum + (item.quantity * item.totalPrice);
    }, 0);

    // Calculate CGST and SGST
    const cgst = totalAmount * 0.03;
    const sgst = totalAmount * 0.03;
    const grandTotal = totalAmount + cgst + sgst;

    const newOrder = new models.PlacedOrder({
      userId,
      items,
      paymentMethod: null,
      totalAmount,
      cgst,
      sgst,
      grandTotal,
      cookingRequest: cookingRequest || null,
      paymentStatus: 'pending',
      orderType: orderType || 'Parcel'
    });

    const savedOrder = await newOrder.save();

    if (paymentType) {
      const paymentMethod = paymentType === 'cash' ? 'Cash' : 'Online';
      savedOrder.paymentMethod = paymentMethod;

      // If it's a cash payment, emit socket event
      if (paymentMethod === 'Cash' && global.io) {
        global.io.emit('newCashPayment', {
          orderId: savedOrder._id,
          amount: savedOrder.totalAmount,
          customerName: savedOrder.userId?.name
        });
      }

      await savedOrder.save();
    }

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder
    });
  } catch (error) {
    console.error("Error creating order:", error);

    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

  const getAllPlacedOrders = async (req, res) => {
    try {
      const orders = await models.PlacedOrder.find({ isDeleted: false });
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
  };

    const getOrderById = async (req, res) => {
      const { orderId } = req.params;
    
      try {
        const order = await models.PlacedOrder.findOne({ _id: orderId, isDeleted: false });
    
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
    
        res.status(200).json(order);
      } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Error fetching order", error: error.message });
      }
    };

    const getUserOrderSummary = async (req, res) => {
      const { userId } = req.params;
    
      try {
        // Find orders that are not deleted and have a payment status of 'pending'
        const orders = await models.PlacedOrder.find({
          userId,
          isDeleted: false,
          paymentStatus: { $nin: ['declined', 'completed'] }
        }).populate('items.itemId', 'itemName imageUrl');
    
        if (!orders || orders.length === 0) {
          return res.status(404).json({ message: "No pending orders found for this user" });
        }
    
        const orderDetails = orders.map(order => ({
          orderId: order._id,
          items: order.items.map(item => ({
            productId: item.itemId._id, // Use productId instead of itemId
            itemName: item.itemId.itemName,
            imageUrl: item.itemId.imageUrl,
            quantity: item.quantity,
            totalPrice: item.totalPrice
          })),
          totalAmount: order.totalAmount
        }));
    
        const subtotal = orderDetails.reduce((sum, order) => sum + order.totalAmount, 0);
        const cgst = subtotal * 0.03;
        const sgst = subtotal * 0.03;
        const grandTotal = subtotal + cgst + sgst;
    
        res.status(200).json({
          orderDetails,
          subtotal,
          cgst,
          sgst,
          grandTotal
        });
      } catch (error) {
        console.error("Error fetching user order summary:", error);
        res.status(500).json({ message: "Error fetching user order summary", error: error.message });
      }
    };
    const getOrdersByUserId = async (req, res) => {
      const { userId } = req.params;
    
      try {
        const orders = await models.PlacedOrder.find({ userId, isDeleted: false });
    
        if (!orders || orders.length === 0) {
          return res.status(404).json({ message: "No orders found for this user" });
        }
    
        res.status(200).json(orders);
      } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Error fetching user orders", error: error.message });
      }
    };
    

    const getOnsitePaymentHistory = async (req, res) => {
      try {
          const orders = await models.PlacedOrder.find({
              orderType: "Onsite",
              paymentStatus: "completed"
          });
          res.status(200).json(orders);
      } catch (error) {
          console.error("Error fetching onsite payment history:", error);
          res.status(500).json({ message: "Error fetching onsite payment history", error: error.message });
      }
  };
  
  const getParcelPaymentHistory = async (req, res) => {
      try {
          const orders = await models.PlacedOrder.find({
              orderType: "Parcel",
              paymentStatus: "completed"
          });
          res.status(200).json(orders);
      } catch (error) {
          console.error("Error fetching parcel payment history:", error);
          res.status(500).json({ message: "Error fetching parcel payment history", error: error.message });
      }
  };

const deletePlaceOrderByUserId = async (req, res) => {
  const { userId, orderId } = req.params;

  try {
    const order = await models.PlacedOrder.findOneAndDelete({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found or you do not have permission to delete this order" });
    }

    res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Error deleting order", error: error.message });
  }
};

const incrementItemQuantity = async (req, res) => {
  const { orderId, itemId } = req.params;

  try {
    const order = await models.PlacedOrder.findOne({ _id: orderId, isDeleted: false });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.find(item => item.itemId._id.toString() === itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    item.quantity += 1;

    // Recalculate totalAmount
    order.totalAmount = order.items.reduce((sum, item) => sum + (item.quantity * item.totalPrice), 0);

    // Recalculate CGST, SGST, and grandTotal
    order.cgst = order.totalAmount * 0.03;
    order.sgst = order.totalAmount * 0.03;
    order.grandTotal = order.totalAmount + order.cgst + order.sgst;

    await order.save();

    res.status(200).json({
      quantity: item.quantity,
      totalPrice: item.totalPrice
    });
  } catch (error) {
    console.error("Error incrementing item quantity:", error);
    res.status(500).json({ message: "Error incrementing item quantity", error: error.message });
  }
};
const decrementItemQuantity = async (req, res) => {
  const { orderId, itemId } = req.params;

  try {
    const order = await models.PlacedOrder.findOne({ _id: orderId, isDeleted: false });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const item = order.items.find(item => item.itemId._id.toString() === itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    if (item.quantity > 1) {
      item.quantity -= 1;

      // Recalculate totalAmount
      order.totalAmount = order.items.reduce((sum, item) => sum + (item.quantity * item.totalPrice), 0);

      // Recalculate CGST, SGST, and grandTotal
      order.cgst = order.totalAmount * 0.03;
      order.sgst = order.totalAmount * 0.03;
      order.grandTotal = order.totalAmount + order.cgst + order.sgst;

      await order.save();

      res.status(200).json({
        quantity: item.quantity,
        totalPrice: item.totalPrice
      });
    } else {
      res.status(400).json({ message: "Item quantity cannot be less than 1" });
    }
  } catch (error) {
    console.error("Error decrementing item quantity:", error);
    res.status(500).json({ message: "Error decrementing item quantity", error: error.message });
  }
};

module.exports = { createPlacedOrder, getAllPlacedOrders , getOrderById, getOnsitePaymentHistory, getParcelPaymentHistory, getOrdersByUserId, getUserOrderSummary, deletePlaceOrderByUserId, incrementItemQuantity, decrementItemQuantity };
