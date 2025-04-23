import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/AddIncome.css";
import API_BASE_URL from "../config";

const AddIncome = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: "",
    source: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/finance/income/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Income added successfully!");
      setFormData({
        amount: "",
        source: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error adding income");
      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  return (
    <div className="add-income-page dark-theme" style={{ minHeight: '100vh', width: '100vw', display: 'flex', background: 'linear-gradient(135deg, #181c2f 0%, #232946 100%)' }}>
      <Sidebar />
      <div className="form-container" style={{ margin: 'auto', width: '100%', maxWidth: 440, background: 'rgba(30,34,54,0.98)', borderRadius: 18, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', padding: '36px 32px 28px 32px' }}>
        <div className="add-income-content dark-theme">
          <div className="add-income-header dark-theme">
            <h2>Add New Income</h2>
            <p>Track your income sources</p>
          </div>
          <form onSubmit={handleSubmit} className="add-income-form dark-theme">
            {error && <div className="error-message dark-theme">{error}</div>}
            {success && <div className="success-message dark-theme">{success}</div>}
            <div className="form-group dark-theme">
              <label>Amount (₹)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="1"
                className="dark-theme-input"
              />
            </div>
            <div className="form-group dark-theme">
              <label>Source</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
                className="dark-theme-select"
              >
                <option value="">Select Source</option>
                <option value="salary">Salary</option>
                <option value="freelance">Freelance</option>
                <option value="business">Business</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group dark-theme">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="dark-theme-input"
              />
            </div>
            <div className="form-group dark-theme">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add a description (optional)"
                className="dark-theme-textarea"
              />
            </div>
            <div className="form-actions dark-theme">
              <button type="submit" className="submit-btn dark-theme-btn">Add Income</button>
              <button
                type="button"
                className="cancel-btn dark-theme-btn"
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddIncome;