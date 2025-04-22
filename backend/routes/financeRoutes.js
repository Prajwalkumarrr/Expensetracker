import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Expense from "../models/expense.js";

const router = express.Router();

// Fetch all expenses for the logged-in user
router.get("/expenses", protect, async (req, res) => {
  try {
    console.log("Fetching expenses for user:", req.user._id);
    const expenses = await Expense.find({ user: req.user._id })
      .sort({ date: -1 })
      .lean();

    console.log("Found expenses:", expenses.length);
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Error fetching expenses" });
  }
});

// Add a new expense
router.post("/expenses", protect, async (req, res) => {
  try {
    const { amount, description, category, date } = req.body;
    console.log("Adding expense:", { amount, description, category, date });
    console.log("User ID:", req.user._id);

    // Validate required fields
    if (!amount || !description || !category) {
      return res.status(400).json({
        message: "Missing required fields",
        received: { amount, description, category, date },
      });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        message: "Invalid amount. Must be a positive number.",
        received: amount,
      });
    }

    // Create and save the expense
    const expense = new Expense({
      user: req.user._id,
      amount: numAmount,
      description: description.trim(),
      category,
      date: date ? new Date(date) : new Date(),
    });

    console.log("Creating expense:", expense);
    const savedExpense = await expense.save();
    console.log("Expense saved:", savedExpense);

    res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Error adding expense:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }
    res.status(500).json({
      message: "Error adding expense",
      error: error.message,
    });
  }
});

// Update an expense
router.put("/expenses/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, category, date } = req.body;

    console.log("Updating expense:", id);
    console.log("User ID:", req.user._id);

    // Validate required fields
    if (!amount || !description || !category) {
      return res.status(400).json({
        message: "Missing required fields",
        received: { amount, description, category, date },
      });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        message: "Invalid amount. Must be a positive number.",
        received: amount,
      });
    }

    // Find and update the expense
    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, user: req.user._id },
      {
        amount: numAmount,
        description: description.trim(),
        category,
        date: date ? new Date(date) : new Date(),
      },
      { new: true }
    );

    if (!updatedExpense) {
      console.log("Expense not found");
      return res.status(404).json({ message: "Expense not found" });
    }

    console.log("Expense updated successfully:", updatedExpense);
    res.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Error updating expense", error: error.message });
  }
});

// Delete an expense
router.delete("/expenses/:id", protect, async (req, res) => {
  try {
    console.log("Deleting expense:", req.params.id);
    console.log("User ID:", req.user._id);

    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!expense) {
      console.log("Expense not found");
      return res.status(404).json({ message: "Expense not found" });
    }

    await expense.deleteOne();
    console.log("Expense deleted successfully");
    res.json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Error deleting expense" });
  }
});

export default router;