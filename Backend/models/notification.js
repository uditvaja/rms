const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'senderModel',
        required: true,
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Customer'],
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'receiverModel',
        required: true,
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['Admin', 'Customer'],
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacedOrder' },
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlacedOrder' }], // Add this line
    type: {
        type: String,
        required: true,
        enum: ['payment', 'order', 'system'],
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false, // Default to unread
    },
    isDeleted: {
        type: Boolean,
        default: false, // Default to not deleted
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

module.exports = Notification;