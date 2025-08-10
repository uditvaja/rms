const Admin = require('./admin')
const Category = require('./category')
const Customer = require('./customer')
const Order = require('./order')
const PlacedOrder = require('./placedOrder')
const Product = require('./product')
const QrCode = require('./qrCode')
const Restaurant = require('./restaurant')
const Notification = require('./notification')

let models = {
    Admin,
    Category,
    Customer,
    Order,
    PlacedOrder,
    Product,
    QrCode,
    Restaurant,
    Notification,
    
}

module.exports =  models