import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import "../styles/AddExpense.css";
import Sidebar from "../components/Sidebar";

const AddExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get expense ID from URL if editing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  });

  const categories = [
    "Food",
    "Transportation",
    "Housing",
    "Utilities",
    "Entertainment",
    "Shopping",
    "Healthcare",
    "Education",
    "Other",
  ];

  // Fetch existing expense details if editing
  useEffect(() => {
    console.log("Expense ID:", id); // Debugging: Check if ID is being passed
    if (id) {
      const fetchExpense = async () => {
        try {
          const token = localStorage.getItem("token");
          const { data } = await axios.get(`${API_BASE_URL}/finance/expenses/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFormData({
            amount: data.amount,
            description: data.description,
            category: data.category,
            date: new Date(data.date).toISOString().split("T")[0],
          });
        } catch (error) {
          setError("Failed to fetch expense details.");
        }
      };
      fetchExpense();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to proceed.");
        navigate("/login");
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount.");
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        setError("Please enter a description.");
        setLoading(false);
        return;
      }

      if (id) {
        // Update existing expense
        await axios.put(`${API_BASE_URL}/finance/expenses/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Expense updated successfully!");
      } else {
        // Add new expense
        await axios.post(`${API_BASE_URL}/finance/expenses`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Expense added successfully!");
      }

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setError(error.response?.data?.message || "Error processing request.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return; // Only allow deletion if editing an existing expense
    const confirmDelete = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmDelete) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to proceed.");
        navigate("/login");
        return;
      }

      await axios.delete(`${API_BASE_URL}/finance/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Expense deleted successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setError(error.response?.data?.message || "Error deleting expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-expense-container">
      <Sidebar />
      <div className="add-expense-content">
        <div className="add-expense-form">
          <h2 className="form-title">{id ? "Edit Expense" : "Add Expense"}</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="input-label">Amount (₹)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter amount"
                step="1"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter description"
                required
              />
            </div>

            <div className="form-group">
              <label className="input-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="select-field"
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="input-label">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (id ? "Updating..." : "Adding...") : id ? "Update Expense" : "Add Expense"}
            </button>
          </form>

          {id && (
            <button
              type="button"
              className="delete-btn"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Expense"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddExpense;