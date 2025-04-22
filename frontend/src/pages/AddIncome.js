import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../styles/AddIncome.css";

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
        "http://localhost:5000/api/income/add",
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
    <div className="add-income-container">
      <Sidebar />
      <div className="add-income-content">
        <div className="add-income-header">
          <h2>Add New Income</h2>
          <p>Track your income sources</p>
        </div>

        <form onSubmit={handleSubmit} className="add-income-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="1"
            />
          </div>

          <div className="form-group">
            <label>Source</label>
            <select name="source" value={formData.source} onChange={handleChange} required>
              <option value="">Select Source</option>
              <option value="salary">Salary</option>
              <option value="freelance">Freelance</option>
              <option value="investments">Investments</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description (optional)"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Add Income
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIncome; 