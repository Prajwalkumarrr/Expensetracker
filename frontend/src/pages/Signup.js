import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config";
import "../styles/LoginSignup.css";

const Signup = () => {
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (userData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting registration with:", userData.email);
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: userData.email,
        password: userData.password
      });
      console.log("Registration response:", res.data);

      if (res.data) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError("Invalid response from server");
      }
    } catch (err) {
      console.error("Registration error:", err.response?.data || err.message);
      if (err.response?.status === 400) {
        setError(err.response.data.message || "User already exists. Please login.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2 className="form-title">Create Account</h2>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input-field"
              value={userData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="input-field"
              value={userData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="6"
              placeholder="Choose a password (min. 6 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="input-field"
              value={userData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="6"
              placeholder="Re-enter your password"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <div className="mt-4 text-center">
          <Link to="/" className="home-link">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
