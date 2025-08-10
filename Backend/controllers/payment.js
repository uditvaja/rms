const razorpay = require('../config/razorpay');
const models = require("../models");
const { io } = require('../server');
const { createNotification, sendNotification } = require('./notification');
const { getIO, getOnlineUsers , initSocket } = require('../socketUtil');

const initiatePayment = async (req, res) => {
    try {
        const { userId } = req.body;
        
        const orders = await models.PlacedOrder.find({ userId, paymentMethod: { $ne: "Online" }, paymentStatus: { $ne: "completed" } });
        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: "No pending orders found for this user" });
        }

        // Ensure all orders have a minimum amount requirement
        const invalidOrders = orders.filter(order => order.grandTotal < 1);
        if (invalidOrders.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "All orders must have a grand total of at least ₹1" 
            });
        }

        // Update payment method and status for all orders
        for (let order of orders) {
            order.paymentMethod = 'Online';
            order.paymentStatus = 'pending';
            await order.save();
        }

        const paymentOptions = {
            amount: orders.reduce((sum, order) => sum + order.grandTotal, 0)*100, // Total grand total for all orders
            currency: "INR",
            receipt: `receipt_${userId}`,
            notes: {
                userId: userId
            }
        };

        const paymentOrder = await razorpay.orders.create(paymentOptions);

        res.status(200).json({
            success: true,
            order: paymentOrder,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Error initiating payment:", error);
        res.status(500).json({ message: "Error initiating payment", error: error.message });
    }
};
const handlePaymentCallback = async (req, res) => {
    try {
        const { userId, razorpayPaymentId } = req.body;

        const orders = await models.PlacedOrder.find({ userId, paymentStatus: 'pending' });
        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: "No pending orders found for this user" });
        }

        // Update payment details for all pending orders
        for (let order of orders) {
            order.paymentStatus = "completed";
            order.paymentId = razorpayPaymentId;
            order.paymentDate = new Date();
            await order.save();
        }

        res.status(200).json({ 
            success: true, 
            message: "Payment successful for all pending orders",
            paymentId: razorpayPaymentId,
            paymentDate: new Date() 
        });
    } catch (error) {
        console.error("Error handling payment callback:", error);
        res.status(500).json({ message: "Error handling payment callback", error: error.message });
    }
};

// const handleCashPayment = async (req, res) => {
//     try {
//         const { orderId } = req.body;
        
//         if (!orderId) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'OrderId is required' 
//             });
//         }
        
//         const order = await models.PlacedOrder.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ 
//                 success: false,
//                 message: 'Order not found' 
//             });
//         }

//         // Check if payment is already processed
//         if (order.paymentStatus === 'completed' || order.paymentStatus === 'declined') {
//             return res.status(400).json({
//                 success: false,
//                 message: `Payment already ${order.paymentStatus}`
//             });
//         }

//         // Update payment status
//         order.paymentMethod = 'Cash';
//         order.paymentStatus = 'pending';
//         await order.save();

//         const io = getIO();
//         if (io) {
//             io.emit('startTimer', { orderId: order._id, duration: 900 });

//             // Set a timeout to emit an event when the timer expires
//             setTimeout(() => {
//                 io.emit('timerExpired', { orderId: order._id });
//             }, 900000); // 15 minutes in milliseconds
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Cash payment request sent to admin'
//         });
//     } catch (error) {
//         console.error('Cash payment error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Error processing cash payment',
//             error: error.message 
//         });
//     }
// };

const handleCashPayment = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false,
                message: 'UserId is required' 
            });
        }
        
        const orders = await models.PlacedOrder.find({ userId, paymentStatus: { $ne: 'completed' }, paymentStatus: { $ne: 'declined' } });
        if (!orders || orders.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No eligible orders found for this user' 
            });
        }

        // Update payment status for all eligible orders
        for (let order of orders) {
            order.paymentMethod = 'Cash';
            order.paymentStatus = 'pending';
            await order.save();
        }

        const io = getIO();
        if (io) {
            orders.forEach(order => {
                io.emit('startTimer', { orderId: order._id, duration: 900 });

                // Set a timeout to emit an event when the timer expires
                setTimeout(() => {
                    io.emit('timerExpired', { orderId: order._id });
                }, 900000); // 15 minutes in milliseconds
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cash payment request sent to admin for all eligible orders'
        });
    } catch (error) {
        console.error('Cash payment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error processing cash payment',
            error: error.message 
        });
    }
};


const acceptCashPayment = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'UserId is required' });
        }

        // Find and update all pending orders for the user, and populate the userId field
        const orders = await models.PlacedOrder.find({ userId, paymentStatus: 'pending' }).populate('userId');

        if (!orders || orders.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot accept payment. No pending payments found for this user.'
            });
        }

        // Update payment details for all pending orders
        for (let order of orders) {
            order.paymentStatus = 'completed';
            order.paymentDate = new Date();
            await order.save();
        }

        // Emit payment accepted event via Socket.IO
        const io = getIO();
        if (io) {
            orders.forEach(order => {
                io.emit('paymentAccepted', { orderId: order._id });
                // Emit timerExpired event to stop the timer
                io.emit('timerExpired', { orderId: order._id });
            });
        } else {
            console.error("Socket.io not initialized");
        }

        // Send notification to the user
        await sendNotification({
            sender: req.user.id,
            receiver: userId,
            type: 'payment',
            title: 'Cash Payment Accepted',
            message: `Your cash payment has been accepted.`,
            additionalData: { 
                amount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
                userId: userId,
                orderIds: orders.map(order => order._id), // Include order IDs for future population
            }
        });

        res.status(200).json({
            success: true,
            message: 'Cash payment accepted successfully for all pending orders',
            orders: orders.map(order => ({
                id: order._id,
                status: order.paymentStatus,
                date: order.paymentDate,
                quantity: order.quantity, // Include quantity in response
                user: order.userId // Include populated user details
            }))
        });
    } catch (error) {
        console.error('Accept payment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error accepting cash payment',
            error: error.message 
        });
    }
};
// const acceptCashPayment = async (req, res) => {
//     try {
//         const { userId } = req.body;
//         if (!userId) {
//             return res.status(400).json({ success: false, message: 'UserId is required' });
//         }

//         // Find and update all pending orders for the user, and populate the userId field
//         const orders = await models.PlacedOrder.find({ userId, paymentStatus: 'pending' }).populate('userId');

//         if (!orders || orders.length === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot accept payment. No pending payments found for this user.'
//             });
//         }

//         // Update payment details for all pending orders
//         for (let order of orders) {
//             order.paymentStatus = 'completed';
//             order.paymentDate = new Date();
//             await order.save();
//         }

//         // Emit payment accepted event via Socket.IO
//         const io = getIO();
//         if (io) {
//             orders.forEach(order => {
//                 io.emit('paymentAccepted', { orderId: order._id });
//                 // Emit timerExpired event to stop the timer
//                 io.emit('timerExpired', { orderId: order._id });
//             });
//         } else {
//             console.error("Socket.io not initialized");
//         }

//         // Calculate the total grand total and total quantity for all orders
//         const totalGrandTotal = orders.reduce((sum, order) => sum + order.grandTotal, 0);
//         const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0); // Assuming each order has a 'quantity' field

//         // Send notification to the user
//         await sendNotification({
//             sender: req.user.id,
//             receiver: userId,
//             type: 'payment',
//             title: 'Cash Payment Accepted',
//             message: `Your cash payment has been accepted.`,
//             additionalData: { 
//                 amount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
//                 totalQuantity: totalQuantity, // Include total quantity
//                 userId: userId,
//                 orderIds: orders.map(order => order._id), // Include order IDs for future population
//             }
//         });

//         res.status(200).json({
//             success: true,
//             message: 'Cash payment accepted successfully for all pending orders',
//             orders: orders.map(order => ({
//                 id: order._id,
//                 status: order.paymentStatus,
//                 date: order.paymentDate,
//                 quantity: order.quantity, // Include quantity in response
//                 user: order.userId // Include populated user details
//             }))
//         });
//     } catch (error) {
//         console.error('Accept payment error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Error accepting cash payment',
//             error: error.message 
//         });
//     }
// };

// const acceptCashPayment = async (req, res) => {
//     try {
//         const { orderId } = req.body;
//         if (!orderId) {
//             return res.status(400).json({ success: false, message: 'OrderId is required' });
//         }

//         // Atomically update the order and fetch it
//         const order = await models.PlacedOrder.findOneAndUpdate(
//             { _id: orderId, paymentStatus: 'pending' },
//             { paymentStatus: 'completed', paymentDate: new Date() },
//             { new: true } 
//         ).populate('userId');

//         if (!order) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Cannot accept payment. Payment may have already been completed or declined.'
//             });
//         }
    
//         // Emit payment accepted event via Socket.IO
//         const io = getIO();
//         if (io) {
//             io.emit('paymentAccepted', { orderId: order._id });
//         } else {
//             console.error("Socket.io not initialized");
//         }
//         // Send notification to the user
//         await sendNotification({
//             sender: req.user.id,
//             receiver: req.user.id,
//             type: 'payment',
//             title: 'Cash Payment Accepted',
//             message: `Your cash payment for order ${orderId} has been accepted.`,
//             additionalData: { 
//                 amount: order.totalAmount,
//                 orderId: order._id 
//             },
//             orderId
//         });

//         res.status(200).json({
//             success: true,
//             message: 'Cash payment accepted successfully',
//             order: {
//                 id: order._id,
//                 status: order.paymentStatus,
//                 date: order.paymentDate
//             }
//         });
//     } catch (error) {
//         console.error('Accept payment error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Error accepting cash payment',
//             error: error.message 
//         });
//     }
// };

// const declineCashPayment = async (req, res) => {
//     try {
//         const { orderId } = req.body;
//         console.log('Admin:', req.user);
        
//         console.log('Received request to decline payment for orderId:', orderId);

//         if (!orderId) {
//             console.log('OrderId is missing from request body');
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'OrderId is required' 
//             });
//         }

//         const order = await models.PlacedOrder.findById(orderId).populate('userId');
//         console.log('Fetched order:', order);

//         if (!order) {
//             console.log('Order not found for orderId:', orderId);
//             return res.status(404).json({ 
//                 success: false,
//                 message: 'Order not found' 
//             });
//         }

//         // Check if payment can be declined
//         if (order.paymentStatus !== 'pending') {
//             console.log(`Cannot decline payment. Current status: ${order.paymentStatus}`);
//             return res.status(400).json({
//                 success: false,
//                 message: `Cannot decline payment. Current status: ${order.paymentStatus}`
//             });
//         }

//         // Update payment status to declined
//         order.paymentStatus = 'declined';
//         order.paymentDate = new Date();
//         await order.save();
//         console.log('Updated order payment status to declined:', order);

//         // Ensure req.user is defined
//         if (!req.user || !req.user.id) {
//             console.log('User information is missing in request');
//             return res.status(400).json({
//                 success: false,
//                 message: 'User information is missing'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Cash payment declined successfully',
//             order: {
//                 id: order._id,
//                 status: order.paymentStatus,
//                 date: order.paymentDate
//             }
//         });
//     } catch (error) {
//         console.error('Decline payment error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Error declining cash payment',
//             error: error.message 
//         });
//     }
// };

// const declineCashPayment = async (req, res) => {
//     try {
//         const { orderId } = req.body;
//         console.log('Admin:', req.user);
        
//         console.log('Received request to decline payment for orderId:', orderId);

//         if (!orderId) {
//             console.log('OrderId is missing from request body');
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'OrderId is required' 
//             });
//         }

//         const order = await models.PlacedOrder.findById(orderId).populate('userId');
//         console.log('Fetched order:', order);

//         if (!order) {
//             console.log('Order not found for orderId:', orderId);
//             return res.status(404).json({ 
//                 success: false,
//                 message: 'Order not found' 
//             });
//         }

//         // Check if payment can be declined
//         if (order.paymentStatus !== 'pending') {
//             console.log(`Cannot decline payment. Current status: ${order.paymentStatus}`);
//             return res.status(400).json({
//                 success: false,
//                 message: `Cannot decline payment. Current status: ${order.paymentStatus}`
//             });
//         }

//         // Update payment status to declined
//         order.paymentStatus = 'declined';
//         order.paymentDate = new Date();
//         await order.save();
//         console.log('Updated order payment status to declined:', order);

//         // Emit timerExpired event via Socket.IO
//         const io = getIO();
//         if (io) {
//             io.emit('timerExpired', { orderId: order._id });
//         } else {
//             console.error("Socket.io not initialized");
//         }

//         // Ensure req.user is defined
//         if (!req.user || !req.user.id) {
//             console.log('User information is missing in request');
//             return res.status(400).json({
//                 success: false,
//                 message: 'User information is missing'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: 'Cash payment declined successfully',
//             order: {
//                 id: order._id,
//                 status: order.paymentStatus,
//                 date: order.paymentDate
//             }
//         });
//     } catch (error) {
//         console.error('Decline payment error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Error declining cash payment',
//             error: error.message 
//         });
//     }
// };

const declineCashPayment = async (req, res) => {
    try {
        const { userId } = req.body;
        console.log('Admin:', req.user);
        
        console.log('Received request to decline payment for userId:', userId);

        if (!userId) {
            console.log('UserId is missing from request body');
            return res.status(400).json({ 
                success: false,
                message: 'UserId is required' 
            });
        }

        const orders = await models.PlacedOrder.find({ userId, paymentStatus: 'pending' });
        console.log('Fetched orders:', orders);

        if (!orders || orders.length === 0) {
            console.log('No pending orders found for userId:', userId);
            return res.status(404).json({ 
                success: false,
                message: 'No pending orders found for this user' 
            });
        }

        // Update payment status to declined for all pending orders
        for (let order of orders) {
            order.paymentStatus = 'declined';
            order.paymentDate = new Date();
            await order.save();
            console.log('Updated order payment status to declined:', order);
        }

        // Emit timerExpired event via Socket.IO
        const io = getIO();
        if (io) {
            orders.forEach(order => {
                io.emit('timerExpired', { orderId: order._id });
            });
        } else {
            console.error("Socket.io not initialized");
        }

        // Ensure req.user is defined
        if (!req.user || !req.user.id) {
            console.log('User information is missing in request');
            return res.status(400).json({
                success: false,
                message: 'User information is missing'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cash payment declined successfully for all pending orders',
            orders: orders.map(order => ({
                id: order._id,
                status: order.paymentStatus,
                date: order.paymentDate
            }))
        });
    } catch (error) {
        console.error('Decline payment error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error declining cash payment',
            error: error.message 
        });
    }
};

module.exports = {
    initiatePayment,
    handlePaymentCallback,
    handleCashPayment,
    acceptCashPayment,
    declineCashPayment
}; 