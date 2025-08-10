const mongoose = require('mongoose');


const qrCodeSchema = new mongoose.Schema({
  activeTab: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
    trim: true,
  },
  qrName: {
    type: Number,
    trim: true,
    default: null,
  },
  additionalText: {
    type: String,
    trim: true,
    default: null,
  },
  chooseColor: {
    type: String,
    required: true,
    default: '#ffffff',
  },
  frameColor: {
    type: String,
    required: true,
    default: '#000000',
  },
  qrColor: {
    type: String,
    required: true,
    default: '#000000',
  },
  contentCategory: {
    type: String,
    required: true,
    enum: ['Food & Drink', 'Other'],
    default: 'Other',
  },
  isTable:{
    type: Boolean, // true = table,false = counter
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const QRCode = mongoose.models.QRCode || mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;