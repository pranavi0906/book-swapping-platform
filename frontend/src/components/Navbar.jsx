// Navbar.jsx
import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ toggleMenu, menuOpen }) => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch username from localStorage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <nav className="navbar">
      {/* Left section - Hamburger + Logo */}
      <div className="nav-left">
        <button className="hamburger-btn" onClick={toggleMenu} style={{ color: "white", backgroundColor: "transparent", border: "none" }}>
          {menuOpen ? "✖" : "☰"}
        </button>
        <div className="logo">
          📚 <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>BookSwap</span>
        </div>
      </div>

      {/* Right section - User icon */}
      <div className="nav-right">
        <span className="navbar-user-icon" onClick={() => navigate("/profile")}>
          <FaUser color="white" size={22} style={{ cursor: "pointer" }} />
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
