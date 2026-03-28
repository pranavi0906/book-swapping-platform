

import React, { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FaUser } from "react-icons/fa";
import "./Admin.css";

const Admin = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [toastMessage, setToastMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/admin/books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(res.data);
    } catch (err) {
      console.error("Error fetching books:", err);
    }
  };

  const fetchSwaps = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/admin/swaps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSwaps(res.data);
    } catch (err) {
      console.error("Error fetching swaps:", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/admin/complaints", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/admin/feedbacks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "users" && users.length === 0) fetchUsers();
    if (tab === "books" && books.length === 0) fetchBooks();
    if (tab === "swaps" && swaps.length === 0) fetchSwaps();
    if (tab === "complaints" && complaints.length === 0) fetchComplaints();
    if (tab === "feedbacks" && feedbacks.length === 0) fetchFeedbacks();
  };

  const toggleUserStatus = async (userId) => {
    try {
      await axios.patch(`http://localhost:3000/api/admin/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("User status toggled");
      fetchUsers();
    } catch (err) {
      console.error("Error toggling user status:", err);
      showToast("Error toggling user status");
    }
  };

  const removeBook = async (bookId) => {
    const confirmed = window.confirm("Are you sure you want to remove this book? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:3000/api/admin/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Book removed");
      fetchBooks();
    } catch (err) {
      console.error("Error removing book:", err);
      showToast("Error removing book");
    }
  };

  const cancelSwap = async (swapId) => {
    try {
      await axios.patch(`http://localhost:3000/api/admin/swaps/${swapId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Swap cancelled");
      fetchSwaps();
    } catch (err) {
      console.error("Error cancelling swap:", err);
      showToast("Error cancelling swap");
    }
  };

  const resolveComplaint = async (complaintId) => {
    try {
      await axios.put(`http://localhost:3000/api/complaints/${complaintId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Complaint resolved");
      fetchComplaints();
    } catch (err) {
      console.error("Error resolving complaint:", err);
      showToast("Error resolving complaint");
    }
  };

  const dismissComplaint = async (complaintId) => {
    try {
      await axios.put(`http://localhost:3000/api/complaints/${complaintId}/dismiss`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Complaint dismissed");
      fetchComplaints();
    } catch (err) {
      console.error("Error dismissing complaint:", err);
      showToast("Error dismissing complaint");
    }
  };

  const deleteFeedback = async (feedbackId) => {
    try {
      await axios.delete(`http://localhost:3000/api/admin/feedbacks/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Feedback deleted");
      fetchFeedbacks();
    } catch (err) {
      console.error("Error deleting feedback:", err);
      showToast("Error deleting feedback");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user account? This action cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:3000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("User account deleted");
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("Error deleting user");
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const chartData = [
    { name: "Books", value: stats.totalBooks || 0 },
    { name: "Users", value: stats.totalUsers || 0 },
    { name: "Swaps", value: stats.totalSwaps || 0 },
    { name: "Pending Swaps", value: stats.pendingSwaps || 0 },
    { name: "Feedbacks", value: stats.totalFeedbacks || 0 },
  ];

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-profile-container">
          <span className="user-icon" onClick={toggleDropdown}>
            <FaUser color="#1e3a8a" size={22} style={{ cursor: "pointer" }} />
          </span>
          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          )}
        </div>
      </header>

      <nav className="admin-nav">
        <button onClick={() => handleTabChange("overview")} className={activeTab === "overview" ? "active" : ""}>Overview</button>
        <button onClick={() => handleTabChange("users")} className={activeTab === "users" ? "active" : ""}>User Management</button>
        <button onClick={() => handleTabChange("books")} className={activeTab === "books" ? "active" : ""}>Book Management</button>
        <button onClick={() => handleTabChange("swaps")} className={activeTab === "swaps" ? "active" : ""}>Swap Management</button>
        <button onClick={() => handleTabChange("complaints")} className={activeTab === "complaints" ? "active" : ""}>Complaints</button>
        <button onClick={() => handleTabChange("feedbacks")} className={activeTab === "feedbacks" ? "active" : ""}>Feedback & Reports</button>
      </nav>

      <main className="admin-main">
        {activeTab === "overview" && (
          <div className="overview">
            <div className="stats-cards">
              <div className="stat-card">
                <h3>📚 Total Books</h3>
                <p>{stats.totalBooks || 0}</p>
              </div>
              <div className="stat-card">
                <h3>👥 Total Users</h3>
                <p>{stats.totalUsers || 0}</p>
              </div>
              <div className="stat-card">
                <h3>🔄 Total Swaps</h3>
                <p>{stats.totalSwaps || 0}</p>
              </div>
              <div className="stat-card">
                <h3>🚫 Pending Swaps</h3>
                <p>{stats.pendingSwaps || 0}</p>
              </div>
              <div className="stat-card">
                <h3>⚠️ Total Complaints</h3>
                <p>{stats.totalComplaints || 0}</p>
              </div>
              <div className="stat-card">
                <h3>🚨 Pending Complaints</h3>
                <p>{stats.pendingComplaints || 0}</p>
              </div>
              <div className="stat-card">
                <h3>📅 Overdue Books</h3>
                <p>{stats.overdueBooks || 0}</p>
              </div>
              <div className="stat-card">
                <h3>🚫 Restricted Users</h3>
                <p>{stats.restrictedUsers || 0}</p>
              </div>
              <div className="stat-card">
                <h3>⚠️ Total Feedbacks</h3>
                <p>{stats.totalFeedbacks || 0}</p>
              </div>
            </div>
            <div className="chart-container">
              <h3>Platform Statistics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="user-management">
            <h2>User Management</h2>
            <table>
              <thead>
                <tr>
              <th>Username</th>
              <th>Student ID</th>
              <th>Email</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.studentId}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>{user.status}</td>
                    <td>
                      <button onClick={() => toggleUserStatus(user._id)}>Toggle Status</button>
                      <button onClick={() => deleteUser(user._id)} style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "books" && (
          <div className="book-management">
            <h2>Book Management</h2>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.genre}</td>
                    <td>{book.userId?.username || "N/A"}</td>
                    <td>{book.status || "Available"}</td>
                    <td>
                      <button onClick={() => removeBook(book._id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "swaps" && (
          <div className="swap-management">
            <h2>Swap Management</h2>
            <table>
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Owner</th>
                  <th>Book Title</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {swaps.map((swap) => (
                  <tr key={swap._id}>
                    <td>{swap.requesterId?.username || "N/A"}</td>
                    <td>{swap.ownerId?.username || "N/A"}</td>
                    <td>{swap.bookId?.title || "N/A"}</td>
                    <td>{swap.status}</td>
                    <td>
                      {swap.status === "pending" && (
                        <button onClick={() => cancelSwap(swap._id)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="complaints-management">
            <h2>Complaints Management</h2>
            <table>
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Complainant</th>
                  <th>Defendant</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint._id}>
                    <td>{complaint.complaintId}</td>
                    <td>{complaint.complainantId?.username || "N/A"}</td>
                    <td>{complaint.defendantId?.username || "N/A"}</td>
                    <td>{complaint.complaintType}</td>
                    <td>{complaint.status}</td>
                    <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                    <td>
                      {complaint.status === "pending" && (
                        <>
                          <button onClick={() => resolveComplaint(complaint._id)}>Resolve</button>
                          <button onClick={() => dismissComplaint(complaint._id)}>Dismiss</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "feedbacks" && (
          <div className="feedback-reports">
            <h2>Feedback & Reports</h2>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Book</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((feedback) => (
                  <tr key={feedback._id}>
                    <td>{feedback.fromUserId?.username || "N/A"}</td>
                    <td>{feedback.swapRequestId?.bookId?.title || "N/A"}</td>
                    <td>{feedback.rating}</td>
                    <td>{feedback.comment}</td>
                    <td>{new Date(feedback.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => deleteFeedback(feedback._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default Admin;


