const models = require("../models");
const { getIO, getOnlineUsers , initSocket } = require('../socketUtil');

exports.createNotification = async (req, res) => {
    try {
        const { sender, receiver, type, title, message, amount } = req.body;

        const notification = new models.Notification({
            sender,
            receiver,
            type,
            title,
            message,
            amount,
            status: 'Pending',
            read: false 
        });

        await notification.save();

        // Emit a socket event to notify the receiver if they are online
        const onlineUsers = getOnlineUsers();
        const socketId = onlineUsers.get(receiver); // Get the socket ID of the receiver

        if (socketId) {
            const io = getIO();
            io.to(socketId).emit('newNotification', notification); // Emit the new notification
        }

        res.status(201).json(notification); // Respond with the created notification
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get notifications for a user
//get notifiction -> admin
// exports.getNotifications = async (req, res) => {
//     try {
//         const userId = req.user.userId; // Ensure user is authenticated
//         console.log("Fetching notifications for user ID:", userId); // Debug log
//         console.log("hitting the getNotification");

//         let notifications;

//         // Check if the user is an admin
//         if (req.user.role === 'admin') {
//             // If admin, fetch all notifications
//             notifications = await models.Notification.find()
//                 .populate('sender')
//                 .populate('receiver')
//                 .populate('orderId') // Ensure orderId is populated
//                 .exec();
//         } else {
//             // If not admin, fetch notifications for the specific user
//             notifications = await models.Notification.find({ receiver: userId })
//                 .populate('sender')
//                 .populate('receiver')
//                 .populate('orderId') // Ensure orderId is populated
//                 .exec();
//         }

//         console.log("Fetched notifications:", notifications); // Debug log
//         res.status(200).json(notifications);
//     } catch (error) {
//         console.error("Error fetching notifications:", error);
//         res.status(500).json({ error: error.message });
//     }
// };

// Get notifications for a user
// Get notifications for a user
// exports.getNotifications = async (req, res) => {
//     try {
//         const userId = req.user.userId; // Ensure user is authenticated
//         console.log("Fetching notifications for user ID:", userId); // Debug log

//         let notifications;

//         // Check if the user is an admin
//         if (req.user.role === 'admin') {
//             // If admin, fetch all notifications that are not deleted and populate orderId
//             notifications = await models.Notification.find({ isDeleted: false })
//                 .populate('sender')
//                 .populate('receiver')
//                 .populate('orderId') // Populate orderId to get order details
//                 .exec();
//         } else {
//             // If not admin, fetch notifications for the specific user that are not deleted and populate orderId
//             notifications = await models.Notification.find({ receiver: userId, isDeleted: false })
//                 .populate('sender')
//                 .populate('receiver')
//                 .populate('orderId') // Populate orderId to get order details
//                 .exec();
//         }

//         console.log("Fetched notifications:", notifications); // Debug log
//         res.status(200).json(notifications);
//     } catch (error) {
//         console.error("Error fetching notifications:", error);
//         res.status(500).json({ error: error.message });
//     }
// };

// exports.getNotifications = async (req, res) => {
//     try {
//         const userId = req.user.userId; // Ensure user is authenticated
//         console.log("Fetching notifications for user ID:", userId); // Debug log

//         let notifications;

//         // Check if the user is an admin
//         if (req.user.role === 'admin') {
//             // If admin, fetch all notifications that are not deleted and populate orderIds
//             notifications = await models.Notification.find({ isDeleted: false })
//                 .populate('sender')
//                 .populate('receiver')
//                 .populate({
//                     path: 'orderIds',
//                     select: 'grandTotal quantity',
//                     // populate: { path: 'userId' } // Populate userId if needed
//                 })
//                 .exec();
//         } else {
//             // If not admin, fetch notifications for the specific user that are not deleted and populate orderIds
//             notifications = await models.Notification.find({ receiver: userId, isDeleted: false })
//                 .populate('sender')
//                 .populate('receiver')
//                 .populate({
//                     path: 'orderIds',
//                     select: 'grandTotal quantity',
//                     // populate: { path: 'userId' } // Populate userId if needed
//                 })
//                 .exec();
//         }

//         // Extract grandTotal and quantity from each orderId
//         notifications = notifications.map(notification => {
//             const orderDetails = notification.orderIds.map(order => ({
//                 grandTotal: order.grandTotal,
//                 quantity: order.quantity
//             }));
//             return {
//                 ...notification.toObject(),
//                 orderDetails // Add orderDetails array to the notification object
//             };
//         });

//         console.log("Fetched notifications with order details:", notifications); // Debug log
//         res.status(200).json(notifications);
//     } catch (error) {
//         console.error("Error fetching notifications:", error);
//         res.status(500).json({ error: error.message });
//     }
// };

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId; // Ensure user is authenticated
        console.log("Fetching notifications for user ID:", userId); // Debug log

        let notifications;

        // Check if the user is an admin
        if (req.user.role === 'admin') {
            // If admin, fetch all notifications that are not deleted and populate orderIds
            notifications = await models.Notification.find({ isDeleted: false })
                .populate({
                    path: 'sender',
                    select: '_id' // Only select the _id for sender
                })
                .populate({
                    path: 'receiver',
                    select: '_id name phone' // Select specific fields for receiver
                })
                .populate({
                    path: 'orderIds',
                    select: 'items', // Select items to access quantities
                })
                .exec();
        } else {
            // If not admin, fetch notifications for the specific user that are not deleted and populate orderIds
            notifications = await models.Notification.find({ receiver: userId, isDeleted: false })
                .populate({
                    path: 'sender',
                    select: '_id' // Only select the _id for sender
                })
                .populate({
                    path: 'receiver',
                    select: '_id name phone' // Select specific fields for receiver
                })
                .populate({
                    path: 'orderIds',
                    select: 'items', // Select items to access quantities
                })
                .exec();
        }

        // Extract quantities from each orderId and calculate the sum
        notifications = notifications.map(notification => {
            const orderDetails = notification.orderIds.map(order => ({
                items: order.items.map(item => ({
                    quantity: item.quantity,
                    _id: item._id
                }))
            }));
            const totalQuantity = orderDetails.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

            return {
                ...notification.toObject(),
                orderDetails, // Add orderDetails array to the notification object
                totalQuantity // Add total quantity to the notification object
            };
        });

        console.log("Fetched notifications with order details:", notifications); // Debug log
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: error.message });
    }
};
// Clear all notifications for a user
exports.clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user.userId; // Ensure user is authenticated
        let result;

        // Check if the user is an admin
        if (req.user.role === 'admin') {
            // If admin, soft delete all notifications
            result = await models.Notification.updateMany({}, { isDeleted: true });
        } else {
            // If not admin, soft delete notifications for the specific user
            result = await models.Notification.updateMany({ receiver: userId }, { isDeleted: true });
        }
        
        res.status(200).json({ message: 'Notifications cleared', result });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        res.status(500).json({ error: error.message });
    }
};
// Update notification status
exports.updateNotificationStatus = async (req, res) => {
    try {
        const { notificationId, status } = req.body;
        const notification = await models.Notification.findByIdAndUpdate(
            notificationId,
            { status },
            { new: true }
        );
        res.status(200).json(notification);
    } catch (error) {
        console.error("Error updating notification status:", error);
        res.status(500).json({ error: error.message });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await models.Notification.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );
        res.status(200).json(notification);
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: error.message });
    }
};

// Mark notification as deleted
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await models.Notification.findByIdAndUpdate(
            notificationId,
            { isDeleted: true }, // Mark as deleted
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.status(200).json(notification);
    } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function to send notifications
exports.sendNotification = async ({ sender, receiver, type, title, message, additionalData = {} }) => {
    const notification = new models.Notification({
        sender,
        senderModel: 'Admin',
        receiver,
        receiverModel: 'Customer',
        type,
        title,
        message,
        ...additionalData
    });

    // Save notification
    await notification.save();

    // Emit notification via Socket.IO
    const io = getIO();
    io.emit(`${type}Notification`, {
        userId: receiver,
        notification,
    });

    return notification;
};