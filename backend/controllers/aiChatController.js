import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import API_BASE_URL from "../config";
import Sidebar from "../components/Sidebar";
import "../styles/Dashboard.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Fetch the user name from localStorage
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/finance/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sortedExpenses = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(sortedExpenses);

        setTotalExpenses(sortedExpenses.reduce((sum, expense) => sum + expense.amount, 0));

        const categoryData = sortedExpenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {});
        setCategoryTotals(Object.entries(categoryData).map(([name, value]) => ({ name, value })));

        const monthlyData = sortedExpenses.reduce((acc, expense) => {
          const month = new Date(expense.date).toLocaleString("default", { month: "long" });
          acc[month] = (acc[month] || 0) + expense.amount;
          return acc;
        }, {});
        setMonthlyExpenses(Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })));

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch expenses");
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [navigate]);

  const formatCurrency = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const toggleChat = () => setChatOpen(!chatOpen);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Sidebar />
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading your financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          {/* Greeting Section */}
          <div className="greeting">
            <h3>Hi, BOSS!! 👋</h3>
            <p>Welcome back to your financial dashboard</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Expenses</h3>
            <p className="stat-amount">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="stat-card">
            <h3>Categories</h3>
            <p className="stat-amount">{categoryTotals.length}</p>
          </div>
          <div className="stat-card">
            <h3>This Month</h3>
            <p className="stat-amount">{formatCurrency(monthlyExpenses[monthlyExpenses.length - 1]?.amount || 0)}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-container">
          {/* Expense by Category */}
          <div className="chart-box">
            <h3>Expense by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryTotals} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {categoryTotals.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Expense Breakdown */}
          <div className="chart-box">
            <h3>Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryTotals} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {categoryTotals.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="charts-container">
          {/* Monthly Expenses */}
          <div className="chart-box">
            <h3>Monthly Expenses</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyExpenses}>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Spending Trend */}
          <div className="chart-box">
            <h3>Spending Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyExpenses}>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="recent-expenses">
          <h3>Recent Expenses</h3>
          <div className="expense-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.category}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chat Icon */}
      <div className="chat-icon" onClick={toggleChat}>
        🗨️
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h4>Chat</h4>
            <button onClick={toggleChat}>Close</button>
          </div>
          <div className="chat-body">
            <p>Chat content goes here</p>
          </div>
          <div className="chat-footer">
            <input type="text" placeholder="Type a message..." />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
