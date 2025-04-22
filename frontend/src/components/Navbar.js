// src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css"; // Ensure the correct path to the CSS file

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title"></h1>
        <ul className="navbar-links">
          <li>
            <Link to="/login" className="navbar-link">Login</Link>
          </li>
          <li>
            <Link to="/signup" className="navbar-link">Signup</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
