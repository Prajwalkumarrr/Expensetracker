import Expense from ".../models/Expense.js";

export const addExpense = async (req, res) => {
  const { category, amount } = req.body;
  const expense = await Expense.create({ user: req.user.id, category, amount });
  res.status(201).json(expense);
};
x
export const getExpenses = async (req, res) => {
  const expenses = await Expense.find({ user: req.user.id });
  res.json(expenses);
};
