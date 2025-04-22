import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Register attempt:", { email });

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    console.log("Existing user check:", { exists: !!user });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      email,
      password: hashedPassword
    });

    // Save user
    await user.save();
    console.log("User created:", { id: user._id, email: user.email });

    // Create and return JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: err.message || 'Server error during registration' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", { email });

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    console.log("User found:", { exists: !!user, id: user?._id });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.log("Invalid password");
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Create and return JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log("Login successful:", { id: user._id, email: user.email });
    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message || 'Server error during login' });
  }
});

export default router;
