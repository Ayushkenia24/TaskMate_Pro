const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config({ quiet: true });

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Validate input
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required!' 
      });
    }
    
    // Check if user already exists
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered!' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPassword]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully!',
      userId: result.insertId
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required!' 
      });
    }
    
    // Find user
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password!' 
      });
    }
    
    const user = users[0];
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password!' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user: users[0] 
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching profile' 
    });
  }
};

module.exports = { register, login, getProfile };
