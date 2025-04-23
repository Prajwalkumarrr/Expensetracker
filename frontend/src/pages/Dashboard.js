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
import AISuggestions, { UserProfileCard } from "../components/AISuggestions";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const Dashboard = () => {
  // State declarations
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const userName = localStorage.getItem("userName") || "User";

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Fetch expenses and income data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        // Fetch expenses
        const expensesRes = await axios.get(`${API_BASE_URL}/finance/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedExpenses = expensesRes.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(sortedExpenses);
        setTotalExpenses(sortedExpenses.reduce((sum, expense) => sum + expense.amount, 0));

        // Filter expenses for selected year for pie chart (categoryTotals)
        const expensesForYear = sortedExpenses.filter(exp => new Date(exp.date).getFullYear() === selectedYear);
        const categoryData = expensesForYear.reduce((acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        }, {});
        setCategoryTotals(Object.entries(categoryData).map(([name, value]) => ({ name, value })));

        // Monthly expenses for selected year
        const expensesByMonth = Array(12).fill(0);
        sortedExpenses.forEach(exp => {
          const d = new Date(exp.date);
          if (d.getFullYear() === selectedYear) {
            expensesByMonth[d.getMonth()] += exp.amount;
          }
        });
        setMonthlyExpenses(expensesByMonth.map((amount, idx) => ({ month: new Date(0, idx).toLocaleString('default', { month: 'short' }), amount })));
        // Fetch income
        const incomeRes = await axios.get(`${API_BASE_URL}/finance/income`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedIncome = incomeRes.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setIncome(sortedIncome);
        const totalIncomeForYear = sortedIncome.filter(inc => new Date(inc.date).getFullYear() === selectedYear).reduce((sum, inc) => sum + inc.amount, 0);
        setTotalIncome(totalIncomeForYear);
        // Calculate balance
        const totalExpensesForYear = sortedExpenses.filter(exp => new Date(exp.date).getFullYear() === selectedYear).reduce((sum, exp) => sum + exp.amount, 0);
        setBalance(totalIncomeForYear - totalExpensesForYear);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, selectedYear]);

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

        const totalExpensesForYear = updatedExpenses.filter(exp => new Date(exp.date).getFullYear() === selectedYear).reduce((sum, exp) => sum + exp.amount, 0);
        setBalance(totalIncome - totalExpensesForYear);

        return updatedExpenses;
      });
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  };

  // Dummy/fallback user info
  const user = {
    name: 'Prajwal Kumar',
    avatar: null // or provide a URL if you have a profile pic
  };

  // Example net worth and savings goal (replace with real values if available)
  const netWorth = balance + 50000; // Example: balance + assets
  const savingsGoal = 100000; // Example goal, replace as needed
  const motivationalQuote = 'Stay focused, go after your dreams and keep moving toward your goals.';
  const petImage = null; // Optionally, provide a pet image URL

  const handleQuickAction = (action) => {
    if (action === 'add-expense') navigate('/add-expense');
    if (action === 'add-income') navigate('/add-income');
    if (action === 'export') {
      // Implement export logic or show a message
      alert('Export feature coming soon!');
    }
  };

  const recentTransactions = expenses
    .filter(e => new Date(e.date).getFullYear() === selectedYear)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleEditExpense = (expenseId) => {
    navigate(`/edit-expense/${expenseId}`);
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      await axios.delete(`${API_BASE_URL}/finance/expenses/${expenseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses((prev) => prev.filter((expense) => expense._id !== expenseId));
    } catch (err) {
      alert("Error deleting expense");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div>Error: {error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Calculate total income and total expenses for just the selected year
  const totalIncomeForYear = income.filter(i => new Date(i.date).getFullYear() === selectedYear).reduce((sum, i) => sum + i.amount, 0);
  const totalExpensesForYear = expenses.filter(e => new Date(e.date).getFullYear() === selectedYear).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-content">
        {/* Header Row: Profile, Filters (left); AI Suggestions (right) */}
        <div className="dashboard-header-row" style={{alignItems: 'flex-start'}}>
          <div className="dashboard-header-left">
            <UserProfileCard user={user} />
            <div className="dashboard-filters">
              <label htmlFor="year-select">Year:</label>
              <select id="year-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                {Array.from(new Set([...expenses, ...income].map(item => new Date(item.date).getFullYear()))).sort((a, b) => b - a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {/* Stat cards and AI Suggestions side by side BELOW year filter */}
            <div style={{display: 'flex', flexDirection: 'row', gap: '28px', alignItems: 'stretch', marginTop: '18px'}}>
              <div className="stats-row" style={{flexDirection: 'row', gap: '22px', minWidth: '220px', margin: 0, alignItems: 'stretch', height: '100%'}}>
                <div className={`stat-card balance-${balance >= 0 ? 'positive' : 'negative'}`}> 
                  <h4>Available Balance</h4>
                  <p>{formatCurrency(balance)}</p>
                </div>
                <div className="stat-card">
                  <h4>Total Income</h4>
                  <p>{formatCurrency(totalIncomeForYear)}</p>
                </div>
                <div className="stat-card">
                  <h4>Total Expenses</h4>
                  <p>{formatCurrency(totalExpensesForYear)}</p>
                </div>
              </div>
              <div className="dashboard-header-right" style={{flex: 1, minWidth: 320}}>
                <AISuggestions
                  expenses={expenses.filter(e => new Date(e.date).getFullYear() === selectedYear)}
                  income={income.filter(i => new Date(i.date).getFullYear() === selectedYear).reduce((sum, i) => sum + i.amount, 0)}
                  netWorth={netWorth}
                  savingsGoal={savingsGoal}
                  user={user}
                  motivationalQuote={motivationalQuote}
                  petImage={petImage}
                  onQuickAction={handleQuickAction}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Charts Row - moved below stats and AI Suggestions */}
        <div className="charts-row" style={{marginTop: '32px'}}>
          <div className="chart-container">
            <h4>Expenses by Category</h4>
            <PieChart width={350} height={200}>
              <Pie data={categoryTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {categoryTotals.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
          <div className="chart-container">
            <h4>Monthly Expense Trend</h4>
            <BarChart width={350} height={200} data={monthlyExpenses}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#a5ffd6" />
            </BarChart>
          </div>
        </div>
        {/* Recent Transactions */}
        <div className="recent-expenses">
          <h4>Recent Transactions</h4>
          <div className="expense-table-container">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>No transactions for this year.</td>
                  </tr>
                ) : (
                  recentTransactions.slice(0, 10).map((exp) => (
                    <tr key={exp._id}>
                      <td>{new Date(exp.date).toLocaleDateString()}</td>
                      <td>{exp.description}</td>
                      <td>{exp.category}</td>
                      <td>{formatCurrency(exp.amount)}</td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDeleteExpense(exp._id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Chat Interface */}
        <div className={`chat-icon ${chatOpen ? 'active' : ''}`} onClick={toggleChat}>
          <span role="img" aria-label="chat">💬</span>
          {messages.filter((m) => m.sender === 'ai' && !m.read).length > 0 && (
            <span className="notification-badge">
              {messages.filter((m) => m.sender === 'ai' && !m.read).length}
            </span>
          )}
        </div>
        {chatOpen && (
          <div className="chat-panel">
            <div className="chat-header">
              <h4>AI Suggestions</h4>
              <button className="close-btn" onClick={toggleChat}>&times;</button>
            </div>
            <div className="chat-body">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                  <div className="message-content">{msg.text}</div>
                </div>
              ))}
              {aiLoading && <div className="chat-message ai"><div className="message-content">Thinking...</div></div>}
            </div>
            <div className="chat-footer">
              <input
                type="text"
                placeholder="Ask for suggestions..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={aiLoading}
              />
              <button onClick={handleMessageSend} disabled={aiLoading || !newMessage.trim()}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;