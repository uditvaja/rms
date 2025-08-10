const jwt = require('jsonwebtoken');
const models = require('../models');

// Middleware to verify admin access
const adminAuthMiddleware = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided. Please login first"
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.jwt_secret);
        
        // Check if user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only route"
            });
        }

        // Attach user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            userId: decoded.id
        };
        next();
    } catch (error) {
        console.error("Error in admin authentication:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid token or authentication failed"
        });
    }
};

// Middleware to verify customer access
const customerAuthMiddleware = async (req, res, next) => {
    console.log("Cookies:", req.cookies);
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided. Please login first"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log("Decoded token:", decoded);

        if (decoded.role !== 'customer') {
            console.log(`Access denied. Expected role: 'customer', but got: '${decoded.role}'`);
            return res.status(403).json({
                success: false,
                message: "Access denied. Customer only route"
            });
        }

        // Attach user info to request
        req.user = {
            id: decoded.userId, // Ensure userId is populated
            role: decoded.role,
            userId: decoded.userId
        };
        next();
    } catch (error) {
        console.error("Error in customer authentication:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid token or authentication failed"
        });
    }
};

const middleware = async (req, res, next) => {
    let token;
  
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
  
    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.jwt_secret || process.env.JWT_SECRET);
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
        userId: decoded.id || decoded.userId
      };
      console.log(req.user, "------------------------------");
      next();
      
    } catch (error) {
  
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      res.status(401).json({ message: 'Authentication failed' });
    }
  };

module.exports = { adminAuthMiddleware, customerAuthMiddleware, middleware};