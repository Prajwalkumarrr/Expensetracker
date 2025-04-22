import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Food",
        "Transportation",
        "Housing",
        "Utilities",
        "Entertainment",
        "Shopping",
        "Healthcare",
        "Education",
        "Other",
      ],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
expenseSchema.index({ user: 1, date: -1 });

const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default Expense;
