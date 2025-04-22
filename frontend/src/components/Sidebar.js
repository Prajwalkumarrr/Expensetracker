import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "../styles/Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      {/* Menu Button */}
      <button className="menu-button" onClick={() => setIsOpen(!isOpen)}>
        <FaBars />
      </button>

      {/* Sidebar & Overlay */}
      <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={() => setIsOpen(false)}>
        <div className={`sidebar ${isOpen ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <FaTimes />
          </button>

          <div className="sidebar-logo">
            <h2>Finance Tracker</h2>
          </div>

          <ul className="sidebar-list">
            <li>
              <Link
                to="/dashboard"
                className={location.pathname === "/dashboard" ? "active" : ""}
                onClick={() => setIsOpen(false)}
              >
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/add-expense"
                className={location.pathname === "/add-expense" ? "active" : ""}
                onClick={() => setIsOpen(false)}
              >
                ➕ Add Expense
              </Link>
            </li>
           
            <li>
              <button onClick={handleLogout} className="sidebar-link logout-btn">
                🚪 Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
