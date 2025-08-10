const models = require("../models");

const pendingOrder = async (erq, res) => {
    try {
        const order = await models.PlacedOrder.find({
            status: "Pending",
            paymentStatus: "completed",
        });

        res.status(200).json({ message: "Order fetched successfully.", order });
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Error fetching order.", error });
    }
};



const isProgressOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await models.PlacedOrder.findOneAndUpdate(
            { _id: orderId, status: "Pending", paymentStatus: "completed" },
            { status: "isProgress", startTime: Date.now(), makingTime: "00:00" }, // Set making time to "00:00"
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        console.log("Order updated to isProgress:", order); // Debugging line

        res.status(200).json({
            message: "Order accepted successfully.",
            order,
        });
    } catch (error) {
        console.error("Error accepting order:", error);
        res.status(500).json({ message: "Error accepting order.", error });
    }
};

const getIsProgressOrders = async (req, res) => {
    try {
        const orders = await models.PlacedOrder.find({ status: "isProgress" });

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders in progress found." });
        }

        res.status(200).json({

            message: "Orders in progress retrieved successfully.",
            orders,
        });
    } catch (error) {
        console.error("Error fetching in-progress orders:", error);
        res.status(500).json({ message: "Error fetching in-progress orders.", error });
    }
};

const isDeliverOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await models.PlacedOrder.findOne({ _id: orderId, status: "isProgress", paymentStatus: "completed" });

        if (!order) {
            return res
                .status(404)
                .json({ message: "Order not found or already delivered." });
        }

        // Check if startTime is defined and valid
        if (!order.startTime || isNaN(new Date(order.startTime).getTime())) {
            return res.status(400).json({ message: "Start time is not set for this order." });
        }

        const makingTimeInMinutes = Math.floor((Date.now() - new Date(order.startTime).getTime()) / 60000); // Calculate making time in minutes
        const hours = String(Math.floor(makingTimeInMinutes / 60)).padStart(2, '0'); // Calculate hours
        const minutes = String(makingTimeInMinutes % 60).padStart(2, '0'); // Calculate minutes
        const makingTime = `${hours}:${minutes}`; // Format as HH:MM

        const updatedOrder = await models.PlacedOrder.findOneAndUpdate(
            { _id: orderId },
            { status: "isDelivered", makingTime }, // Update making time in HH:MM format
            { new: true }
        );

        res.status(200).json({
            message: "Order delivered successfully.",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Error delivering order:", error);
        res.status(500).json({ message: "Error delivering order.", error });
    }
};

module.exports = {
    pendingOrder,
    isProgressOrder,
    isDeliverOrder,
    getIsProgressOrders
};
