import React, { useState } from "react";
import "./ResetPassword.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    // Validation patterns
    const idPattern = /^[Bb]\d{6}$/;
    const passPattern = /^[_A-Za-z][A-Za-z0-9@#$%^&*!]{7,}$/;

    if (!idPattern.test(studentId)) {
      setError("Invalid Student ID format.");
      return;
    }

    if (!passPattern.test(newPassword)) {
      setError(
        "Password must start with letter/underscore and include letters, numbers, and a special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/reset-password",
        { studentId, newPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      setSuccess("Password updated successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <form className="reset-box" onSubmit={handleReset}>
        <h2>Reset Password</h2>
        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}
        {loading && <div className="loading">Resetting password...</div>}

        <label>Student ID</label>
        <input
          type="text"
          placeholder="e.g. B211234"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />

        <label>New Password</label>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="redirect-text">
          Remember your password?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;
