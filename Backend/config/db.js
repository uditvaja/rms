require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.mongo_url) {
            throw new Error('MongoDB connection string is not defined in environment variables');
        }
        
        await mongoose.connect(process.env.mongo_url, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;

