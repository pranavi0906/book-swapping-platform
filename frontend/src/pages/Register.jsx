
/*
import React, { useState } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const idPattern = /^[Bb]\d{6}$/;
    const emailPattern = /^[A-Za-z0-9._%+-]+@rgukt\.ac\.in$/;
    const passPattern = /^[_A-Za-z][A-Za-z0-9@#$%^&*!]{7,}$/;

    if (!idPattern.test(form.studentId)) return "Invalid Student ID format.";
    if (!emailPattern.test(form.email)) return "Email must end with @rgukt.ac.in.";
    if (!passPattern.test(form.password))
      return "Password must start with letter/underscore and include letters, numbers, special char.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errorMsg = validate();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setError("");
    alert("Registration successful!");
    navigate("/login");
  };

  return (
    <div className="register-container">
      <form className="register-box" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        {error && <div className="error-box">{error}</div>}

        <label>Username</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your name"
          value={form.username}
          onChange={handleChange}
        />

        <label>Student ID</label>
        <input
          type="text"
          name="studentId"
          placeholder="e.g. B211234"
          value={form.studentId}
          onChange={handleChange}
        />

        <label>Domain Email</label>
        <input
          type="email"
          name="email"
          placeholder="example@rgukt.ac.in"
          value={form.email}
          onChange={handleChange}
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
        />

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button type="submit">Register</button>

        <p className="redirect-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
};

export default Register;


*/

/*
import React, { useState } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const idPattern = /^[Bb]\d{6}$/;
    const emailPattern = /^[A-Za-z0-9._%+-]+@rgukt\.ac\.in$/;
    const passPattern = /^[_A-Za-z][A-Za-z0-9@#$%^&*!]{7,}$/;

    if (!idPattern.test(form.studentId)) return "Invalid Student ID format.";
    if (!emailPattern.test(form.email)) return "Email must end with @rgukt.ac.in.";
    if (!passPattern.test(form.password))
      return "Password must start with letter/underscore and include letters, numbers, and a special character.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validate();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setError("");

    try {
      // Backend API call
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        username: form.username,
        studentId: form.studentId,
        email: form.email,
        password: form.password,
      });

      // On success navigate to login
      navigate("/login");
    } catch (err) {
      // Display backend error message
      setError(err.response?.data?.msg || "Registration failed. Try again.");
    }
  };

  return (
    <div className="register-container">
      <form className="register-box" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        {error && <div className="error-box">{error}</div>}

        <label>Username</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your name"
          value={form.username}
          onChange={handleChange}
        />

        <label>Student ID</label>
        <input
          type="text"
          name="studentId"
          placeholder="e.g. B211234"
          value={form.studentId}
          onChange={handleChange}
        />

        <label>Domain Email</label>
        <input
          type="email"
          name="email"
          placeholder="example@rgukt.ac.in"
          value={form.email}
          onChange={handleChange}
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
        />

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button type="submit">Register</button>

        <p className="redirect-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
};

export default Register;

*/

/*
import React, { useState } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const idPattern = /^[Bb]\d{6}$/;
    const emailPattern = /^[A-Za-z0-9._%+-]+@rgukt\.ac\.in$/;
    const passPattern = /^[_A-Za-z][A-Za-z0-9@#$%^&*!]{7,}$/;

    if (!idPattern.test(form.studentId)) return "Invalid Student ID format.";
    if (!emailPattern.test(form.email)) return "Email must end with @rgukt.ac.in.";
    if (!passPattern.test(form.password))
      return "Password must start with letter/underscore and include letters, numbers, and a special character.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validate();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Backend API call
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          username: form.username,
          studentId: form.studentId,
          email: form.email,
          password: form.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Success: navigate to login
      navigate("/login");
    } catch (err) {
      console.error(err);
      // Backend error message or fallback
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-box" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        {error && <div className="error-box">{error}</div>}
        {loading && <div className="loading">Registering...</div>}

        <label>Username</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your name"
          value={form.username}
          onChange={handleChange}
          required
        />

        <label>Student ID</label>
        <input
          type="text"
          name="studentId"
          placeholder="e.g. B211234"
          value={form.studentId}
          onChange={handleChange}
          required
        />

        <label>Domain Email</label>
        <input
          type="email"
          name="email"
          placeholder="example@rgukt.ac.in"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="redirect-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
};

export default Register;
*/

import React, { useState } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const idPattern = /^[Bb]\d{6}$/;
    const emailPattern = /^[A-Za-z0-9._%+-]+@gmail\.com$/;
    const passPattern = /^[_A-Za-z][A-Za-z0-9@#$%^&*!]{7,}$/;

    if (!idPattern.test(form.studentId)) return "Invalid Student ID format.";
    if (!emailPattern.test(form.email)) return "Email must end with @gmail.com.";
    if (!passPattern.test(form.password))
      return "Password must start with letter/underscore and include letters, numbers, and a special character.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validate();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Backend API call: HTTP + port 3000
      const res = await axios.post(
        "http://localhost:3000/api/auth/register",
        {
          username: form.username,
          studentId: form.studentId,
          email: form.email,
          password: form.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log(res.data); // optional: check backend response
      navigate("/login"); // success: redirect to login
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-box" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        {error && <div className="error-box">{error}</div>}
        {loading && <div className="loading">Registering...</div>}

        <label>Username</label>
        <input
          type="text"
          name="username"
          placeholder="Enter your name"
          value={form.username}
          onChange={handleChange}
          required
        />

        <label>Student ID</label>
        <input
          type="text"
          name="studentId"
          placeholder="e.g. B211234"
          value={form.studentId}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="example@gmail.com"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <label>Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="redirect-text">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </form>
    </div>
  );
};

export default Register;
