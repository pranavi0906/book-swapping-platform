
import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validation patterns
    const idPattern = /^[Bb]\d{6}$/;
    const passPattern = /^[_A-Za-z][A-Za-z0-9@#$%^&*!]{7,}$/;

    if (!idPattern.test(studentId)) {
      setError("Invalid Student ID format.");
      return;
    }

    if (!passPattern.test(password)) {
      setError(
        "Password must start with letter/underscore and include letters, numbers, and a special character."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Backend login API call (HTTP + port 3000)
      const res = await axios.post(
        "http://localhost:3000/api/auth/login",
        { studentId, password },
        { headers: { "Content-Type": "application/json" } }
      );

      // Save token, username, userId, and role in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.user.username);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("role", res.data.user.role);

      // Navigate based on role
      if (res.data.user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>
        <h2>Login to BookSwap</h2>
        {error && <div className="error-box">{error}</div>}
        {loading && <div className="loading">Logging in...</div>}

        <label>Student ID</label>
        <input
          type="text"
          placeholder="e.g. B211234"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="redirect-text">
          Don’t have an account?{" "}
          <span onClick={() => navigate("/register")}>Register</span>
        </p>
        <p className="redirect-text">
          <span onClick={() => navigate("/reset-password")}>Forgot Password?</span>
        </p>
      </form>
    </div>
  );
};

export default Login;
