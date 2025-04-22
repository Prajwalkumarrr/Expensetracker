import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Register User Function
export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Registering User:", email);

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    console.log("User Exists Check:", userExists);

    if (userExists) {
      return res.status(400).json({ message: "User already exists. Please log in." });
    }

    // Create new user
    const user = await User.create({ email, password });
    console.log("User Created in DB:", { id: user._id, email: user.email });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({ 
      message: "User registered successfully", 
      token,
      user: { email: user.email }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login Function
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login Attempt with Email:", email);

    // Find user by email
    const user = await User.findOne({ email });
    console.log("User Found in DB:", { id: user?._id, email: user?.email });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up first." });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "Login successful",
      token,
      user: { email: user.email }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
