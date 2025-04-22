// src/pages/Welcome.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Welcome.css"; // Import the Welcome page styles

const Welcome = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">Welcome to Financial Assistant</h1>
        <p className="welcome-description">
          Easily track your expenses, set budgets, and get personalized insights to manage your finances better. Start your journey towards smarter money management today!
        </p>
        <Link to="/login" className="start-btn">
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default Welcome;
