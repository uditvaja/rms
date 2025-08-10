const models = require("../models");

const createOrder = async (req, res) => {
  try {
    const { userId, items } = req.body;
    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const { itemId, quantity, customizations = [] } = item;

      if (!itemId || !quantity) {
        return res.status(400).json({ message: 'Item missing itemId or quantity' });
      }

      const itemDetails = await models.Product.findById(itemId);
      if (!itemDetails) {
        return res.status(404).json({ message: `Item with id ${itemId} not found` });
      }

      let itemPrice = itemDetails.price;

      const safeCustomizations = Array.isArray(customizations) ? customizations : [];

      safeCustomizations.forEach(customization => {

        if (customization.options && Array.isArray(customization.options)) {

          customization.options.forEach(option => {
            itemPrice += option.extraRate || 0;
          });
        } else {
          itemPrice += customization.extraRate || 0;
        }
      });

      const orderItem = {
        itemId,
        quantity,
        customizations: safeCustomizations,
        totalPrice: itemPrice * quantity,
      };

      orderItems.push(orderItem);
      totalAmount += orderItem.totalPrice;
    }

    const newOrder = new models.Order({
      userId,
      items: orderItems,
      totalAmount,
    });

    await newOrder.save();

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = id;

    console.log("User ID received in getOrder:", userId);
    const order = await models.Order.find({ userId });

    if (!order) {
      return res.status(404).json({ message: "No orders found for this user." });
    }

    res.status(200).json({ message: "Order fetched successfully.", order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Error fetching order.", error });
  }
};

const getRecentOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = id;

    console.log("User ID received in getOrder:", userId);
    const order = await models.Order.find({ userId }).sort({ orderDate: -1 }).limit(1);

    if (order.length === 0) {
      return res.status(404).json({ message: "No orders found for this user." });
    }

    res.status(200).json({ message: "Order fetched successfully.", order: order[0] });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Error fetching order.", error });
  }
};

const deleteItem = async (req, res) => {
  const { orderId } = req.params;
  console.log(orderId);


  try {
    const result = await models.Order.deleteOne({ _id: orderId });

    if (result.deletedCount > 0) {
      res.status(200).json({ success: true, message: "Order deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Order not found." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error.", error });
  }
}

module.exports = { createOrder, getOrder, getRecentOrder, deleteItem };