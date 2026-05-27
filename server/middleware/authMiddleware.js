const jwt = require('jsonwebtoken');
require('dotenv').config({ quiet: true });

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to request
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

module.exports = verifyToken;
