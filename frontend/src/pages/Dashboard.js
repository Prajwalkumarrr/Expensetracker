import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import API_BASE_URL from "../config";
import Sidebar from "../components/Sidebar";
import "../styles/Dashboard.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const Dashboard = () => {
  // State declarations
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const userName = localStorage.getItem("userName") || "User";

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fetch expenses data
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
          const month = new Date(expense.date).toLocaleString("default", { month: "short" });
          acc[month] = (acc[month] || 0) + expense.amount;
          return acc;
        }, {});
        setMonthlyExpenses(Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })));

        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toLocaleDateString("en-US", { weekday: 'short' });
        }).reverse();

        const dailyData = last7Days.map(day => {
          const dayExpenses = sortedExpenses.filter(exp => 
            new Date(exp.date).toLocaleDateString("en-US", { weekday: 'short' }) === day
          );
          const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          return { day, amount: total };
        });
        setDailyExpenses(dailyData);

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch expenses");
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [navigate]);

  // Chat functions
  const toggleChat = () => {
    setChatOpen(!chatOpen);
    setTimeout(() => {
      const chatBody = document.querySelector('.chat-body');
      if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 100);
  };

  const handleMessageSend = async () => {
    if (!newMessage.trim()) return;

    const userMsg = { sender: 'user', text: newMessage };
    setMessages(prev => [...prev, userMsg]);
    setNewMessage('');
    setAiLoading(true);

    try { 
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You need to be logged in to use the chat");
      }

      // Prepare expenses data
      const expensesData = categoryTotals.length > 0
        ? categoryTotals.map(c => `${c.name}: ${formatCurrency(c.value)}`).join(', ')
        : 'No expenses data available';
      
      const response = await axios.post(
        `${API_BASE_URL}/ai/chat`,
        {
          message: newMessage,
          expenses: expensesData
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.message) {
        throw new Error("No response from AI");
      }

      setMessages(prev => [...prev, { sender: 'ai', text: response.data.message }]);
    } catch (error) {
      console.error("AI error:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Sorry, I can't respond right now.";
      let errorDetails = "";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (error.response?.data?.details) {
        errorDetails = error.response.data.details;
      }
      
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: errorMessage + (errorDetails ? `\n\nDetails: ${errorDetails}` : ''),
        isError: true 
      }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        const chatBody = document.querySelector('.chat-body');
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
      }, 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleMessageSend();
    }
  };

  // Delete expense handler
  const deleteExpense = async (expenseId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.delete(`${API_BASE_URL}/finance/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update state after deletion
      setExpenses((prev) => {
        const updatedExpenses = prev.filter((expense) => expense._id !== expenseId);
        setTotalExpenses(updatedExpenses.reduce((sum, expense) => sum + expense.amount, 0));

        const newCategoryData = updatedExpenses.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {});
        setCategoryTotals(Object.entries(newCategoryData).map(([name, value]) => ({ name, value })));

        return updatedExpenses;
      });
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

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
          <h2>Financial Dashboard</h2>
          <div className="greeting">
            <h3>Welcome back, {userName}! 👋</h3>
            <p>Here's your financial overview</p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="stats-grid">
          <div className="stat-card total-expenses">
            <h3>Total Expenses</h3>
            <p className="stat-amount">{formatCurrency(totalExpenses)}</p>
            <div className="stat-trend up">↑ 12% from last month</div>
          </div>
          <div className="stat-card categories">
            <h3>Categories</h3>
            <p className="stat-amount">{categoryTotals.length}</p>
            <div className="stat-trend">
              Top: {categoryTotals[0]?.name || 'N/A'}
            </div>
          </div>
          <div className="stat-card monthly">
            <h3>This Month</h3>
            <p className="stat-amount">{formatCurrency(monthlyExpenses[monthlyExpenses.length - 1]?.amount || 0)}</p>
            <div className="stat-trend down">↓ 5% from target</div>
          </div>
        </div>

        <div className="charts-container">
          <div className="chart-box">
            <h3>Expense Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryTotals}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryTotals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>Weekly Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar 
                  dataKey="amount" 
                  fill="#82ca9d" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <h3>Cumulative Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#ffc658"
                  fill="#ffc658"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
                  
        <div className="recent-expenses">
          <h3 style={{ textAlign: "center" }}>Recent Transactions</h3> {/* Center align the heading */}
          <div className="expense-table-container">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id}>
                    <td>{new Date(exp.date).toLocaleDateString()}</td>
                    <td>{exp.category}</td>
                    <td>{exp.description}</td>
                    <td>{formatCurrency(exp.amount)}</td>
                    <td>
                      <button className="delete-btn" onClick={() => deleteExpense(exp._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className={`chat-icon ${chatOpen ? 'active' : ''}`} onClick={toggleChat}>
        <div className="chat-bubble">
          <span>💬</span>
          {messages.length > 0 && !chatOpen && <span className="notification-badge">{messages.length}</span>}
        </div>
      </div>

      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <h4>Finance Assistant</h4>
            <button className="close-btn" onClick={toggleChat}>
              <span>×</span>
            </button>
          </div>
          <div className="chat-body">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>Hello {userName}! How can I help with your finances today?</p>
                <div className="quick-questions">
                  <button onClick={() => setNewMessage("What's my spending trend?")}>
                    What's my spending trend?
                  </button>
                  <button onClick={() => setNewMessage("How can I save more?")}>
                    How can I save more?
                  </button>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${message.sender} ${message.isError ? 'error' : ''}`}
                >
                  <div className="message-content">
                    {message.text}
                    {message.sender === 'ai' && index === messages.length - 1 && aiLoading && (
                      <span className="typing-indicator">...</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="chat-footer">
            <input
              type="text"
              placeholder="Ask about your finances..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={aiLoading}
            />
            <button 
              className="send-btn"
              onClick={handleMessageSend}
              disabled={!newMessage.trim() || aiLoading}
            >
              {aiLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;