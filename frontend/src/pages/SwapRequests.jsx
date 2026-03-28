import React, { useEffect, useState } from "react";
import axios from "axios";
import ComplaintForm from "../components/ComplaintForm";
import "./SwapRequests.css";

const SwapRequests = ({ showToast, refreshBooks, onSwapAction }) => {
  const userId = localStorage.getItem("userId");
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [activeRequests, setActiveRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [selectedRequestForComplaint, setSelectedRequestForComplaint] = useState(null);

  const fetchRequests = async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/swapRequests/${userId}?type=active`),
        axios.get(`http://localhost:3000/api/swapRequests/${userId}?type=history`)
      ]);
      setActiveRequests(activeRes.data);
      setHistoryRequests(historyRes.data);
    } catch (err) {
      console.error("Error fetching swap requests:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action, extraData = {}) => {
    try {
      if (action === "return") {
        await axios.put(`http://localhost:3000/api/swapRequests/return/${requestId}`);
        showToast("Return request sent 📤");
      } else if (action === "accept-return") {
        await axios.put(`http://localhost:3000/api/swapRequests/accept-return/${requestId}`);
        showToast("Book Return accepted ✅");
      } else if (action === "complete-return") {
        await axios.put(`http://localhost:3000/api/swapRequests/complete-return/${requestId}`);
        showToast("Book returned successfully ✅");
        // Refresh swap stats after completing return
        if (onSwapAction) onSwapAction();
      } else if (action === "feedback-submitted") {
        showToast("Feedback submitted successfully ✅");
      } else {
        const payload = { status: action, ...extraData };
        await axios.put(`http://localhost:3000/api/swapRequests/update/${requestId}`, payload);
        showToast(`Request ${action} ✅`);
        // Refresh swap stats after accepting request
        if (action === "accepted" && onSwapAction) onSwapAction();
      }
      fetchRequests();
      if (refreshBooks) refreshBooks(); // Refresh books to update statuses immediately
    } catch (err) {
      showToast("Error updating status ❌");
    }
  };

  const handleFeedback = async (requestId, rating, comment) => {
    try {
      await axios.post(`http://localhost:3000/api/feedback/submit`, {
        swapRequestId: requestId,
        rating: parseInt(rating),
        comment
      });
      showToast("Feedback submitted successfully ✅");
      fetchRequests();
    } catch (err) {
      showToast("Error submitting feedback ❌");
    }
  };

  const currentRequests = activeTab === 'active' ? activeRequests : historyRequests;
  const sent = currentRequests.filter((r) => r.requesterId._id === userId);
  const received = currentRequests.filter((r) => r.ownerId._id === userId);
  const returnRequests = currentRequests.filter((r) => r.ownerId._id === userId && r.returnRequested);

  const renderTable = (requests, type) => (
    <div className="table-container">
      <table className="requests-table">
        <thead>
          <tr>
            <th>Book Title</th>
            <th>Author</th>
            <th>User</th>
            <th>Student ID</th>
            <th>Status</th>
            {activeTab === 'history' ? <th>Completed Date</th> : <th>Due Date</th>}
            {activeTab === 'active' ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req._id}>
              <td>{req.bookId?.title || 'N/A'}</td>
              <td>{req.bookId?.author || 'N/A'}</td>
              <td>
                {type === "sent" ? req.ownerId?.username : req.requesterId?.username}
              </td>
              <td>
                {type === "sent" ? req.ownerId?.studentId : req.requesterId?.studentId}
              </td>
              <td>
                {activeTab === 'history' ? (
                  <span className={`status-${req.status === 'accepted' && req.returnAccepted ? 'returned' : req.status === 'rejected' ? 'cancelled' : req.status}`}>
                    {req.status === 'accepted' && req.returnAccepted ? 'Returned' :
                     req.status === 'rejected' ? 'Cancelled' : req.status}
                  </span>
                ) : (
                  <>
                    <span className={`status-${req.status}`}>
                      {req.status}
                    </span>
                    {req.returnRequested && !req.returnAccepted && (
                      <span className="return-requested"> (Return Requested)</span>
                    )}
                    {req.returnAccepted && (
                      <span className="return-accepted"> (Return Accepted)</span>
                    )}
                  </>
                )}
              </td>
              <td>
                {activeTab === 'history'
                  ? (req.completedAt ? new Date(req.completedAt).toLocaleDateString() : '-')
                  : (req.dueDate ? new Date(req.dueDate).toLocaleDateString() : '-')
                }
              </td>
              {activeTab === 'active' && (
                <td>
                  <div className="action-buttons">
                    {type === "received" && req.status === "pending" && (
                      <>
                        <button
                          className="accept-btn"
                          onClick={() => {
                            // Open modal for acceptance details
                            const modal = document.getElementById(`accept-modal-${req._id}`);
                            if (modal) modal.style.display = 'flex';
                          }}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleAction(req._id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {type === "sent" && req.status === "accepted" && !req.returnRequested && !req.returnAccepted && (
                      <button
                        className="return-btn"
                        onClick={() => {
                          // Open feedback modal for return
                          const modal = document.getElementById(`return-feedback-modal-${req._id}`);
                          if (modal) modal.style.display = 'flex';
                        }}
                      >
                        Return Book
                      </button>
                    )}
                    {type === "return" && (
                      <>
                        {!req.returnAccepted && (
                          <button
                            className="accept-return-btn"
                            onClick={() => handleAction(req._id, "accept-return")}
                          >
                            Accept Return
                          </button>
                        )}
                        {req.returnAccepted && (
                          <button
                            className="complete-return-btn"
                            onClick={() => handleAction(req._id, "complete-return")}
                          >
                            Book Returned
                          </button>
                        )}
                      </>
                    )}
                    {req.returnAccepted && req.feedbackDeadline && new Date() <= new Date(req.feedbackDeadline) && (
                      <button
                        className="feedback-btn"
                        onClick={() => {
                          // Open feedback modal
                          const modal = document.getElementById(`feedback-modal-${req._id}`);
                          if (modal) modal.style.display = 'flex';
                        }}
                      >
                        Give Feedback
                      </button>
                    )}
                    {req.status === "accepted" && req.returnAccepted && (
                      <button
                        className="complaint-btn"
                        onClick={() => {
                          setSelectedRequestForComplaint(req);
                          setShowComplaintForm(true);
                        }}
                      >
                        File Complaint
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all your swap history? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:3000/api/swapRequests/clear-history/${userId}`);
        showToast('History cleared successfully ✅');
        fetchRequests();
      } catch (err) {
        showToast('Error clearing history ❌');
      }
    }
  };

  return (
    <div className="swap-requests-page">
      <h2>Swap Requests</h2>

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'active' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'active' ? 'white' : '#333',
            fontWeight: '500'
          }}
        >
          Active Requests
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'history' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'history' ? 'white' : '#333',
            fontWeight: '500'
          }}
        >
          History ({historyRequests.length})
        </button>
        {activeTab === 'history' && historyRequests.length > 0 && (
          <button
            onClick={handleClearHistory}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: '#dc3545',
              color: 'white',
              fontWeight: '500',
              marginLeft: 'auto'
            }}
          >
            Clear History
          </button>
        )}
      </div>

      {activeTab === 'active' ? (
        <>
          <div className="requests-section">
            <h3> Requests I Sent</h3>
            {sent.length > 0 ? renderTable(sent, "sent") : <p>No active requests sent.</p>}
          </div>

          <div className="requests-section">
            <h3> Requests I Received</h3>
            {received.length > 0 ? renderTable(received, "received") : <p>No active incoming requests.</p>}
          </div>

          <div className="requests-section">
            <h3>🔄 Return Requests</h3>
            {returnRequests.length > 0 ? renderTable(returnRequests, "return") : <p>No active return requests.</p>}
          </div>
        </>
      ) : (
        <div className="requests-section">
          <h3>📚 Swap History</h3>
          {historyRequests.length > 0 ? renderTable(historyRequests, "history") : <p>No swap history available.</p>}
        </div>
      )}

      {/* Modals for acceptance and feedback */}
      {currentRequests.map((req) => (
        <div key={`modals-${req._id}`}>
          {/* Accept Modal */}
          {req.ownerId._id === userId && req.status === "pending" && (
            <div id={`accept-modal-${req._id}`} className="modal-overlay" style={{display: 'none'}}>
              <div className="modal-content">
                <h3>Accept Swap Request</h3>
                <p>Please provide the exchange details for "{req.bookId?.title}":</p>
                <div className="modal-form">
                  <label>
                    Place:
                    <input
                      type="text"
                      id={`place-${req._id}`}
                      placeholder="e.g., Library Entrance"
                      required
                    />
                  </label>
                  <label>
                    Time:
                    <input
                      type="time"
                      id={`time-${req._id}`}
                      required
                    />
                  </label>
                  <label>
                    Due Date:
                    <input
                      type="date"
                      id={`dueDate-${req._id}`}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button
                    className="accept-btn"
                    onClick={() => {
                      const place = document.getElementById(`place-${req._id}`).value;
                      const time = document.getElementById(`time-${req._id}`).value;
                      const dueDate = document.getElementById(`dueDate-${req._id}`).value;

                      if (!place || !time || !dueDate) {
                        alert("Please fill in all details: place, time, and due date.");
                        return;
                      }

                      handleAction(req._id, "accepted", { place, time, dueDate });
                      const modal = document.getElementById(`accept-modal-${req._id}`);
                      if (modal) modal.style.display = 'none';
                    }}
                  >
                    Accept Request
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      const modal = document.getElementById(`accept-modal-${req._id}`);
                      if (modal) modal.style.display = 'none';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Modal */}
          {req.returnAccepted && req.feedbackDeadline && new Date() <= new Date(req.feedbackDeadline) && (
            <div id={`feedback-modal-${req._id}`} className="modal-overlay" style={{display: 'none'}}>
              <div className="modal-content">
                <h3>Give Feedback</h3>
                <p>Share your experience with this swap:</p>
                <div className="modal-form">
                  <label>
                    Rating (1-5):
                    <input
                      type="number"
                      id={`rating-${req._id}`}
                      min="1"
                      max="5"
                      required
                    />
                  </label>
                  <label>
                    Comment:
                    <textarea
                      id={`comment-${req._id}`}
                      rows="4"
                      placeholder="Share your thoughts..."
                      required
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button
                    className="accept-btn"
                    onClick={() => {
                      const rating = document.getElementById(`rating-${req._id}`).value;
                      const comment = document.getElementById(`comment-${req._id}`).value;

                      if (!rating || !comment) {
                        alert("Please provide both rating and comment.");
                        return;
                      }

                      // Handle feedback submission
                      handleFeedback(req._id, rating, comment);
                      const modal = document.getElementById(`feedback-modal-${req._id}`);
                      if (modal) modal.style.display = 'none';
                    }}
                  >
                    Submit Feedback
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      const modal = document.getElementById(`feedback-modal-${req._id}`);
                      if (modal) modal.style.display = 'none';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Return Feedback Modal */}
          {req.requesterId._id === userId && req.status === "accepted" && !req.returnRequested && !req.returnAccepted && (
            <div id={`return-feedback-modal-${req._id}`} className="modal-overlay" style={{display: 'none'}}>
              <div className="modal-content">
                <h3>Return Book & Give Feedback</h3>
                <p>Rate the book "{req.bookId?.title}" and its condition (optional):</p>
                <div className="modal-form">
                  <label>
                    Rating (1-5 stars):
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${document.getElementById(`return-rating-${req._id}`)?.value >= star ? "selected" : ""}`}
                          onClick={() => {
                            const ratingInput = document.getElementById(`return-rating-${req._id}`);
                            if (ratingInput) ratingInput.value = star;
                            // Update star display
                            const stars = document.querySelectorAll(`#return-feedback-modal-${req._id} .star`);
                            stars.forEach((s, index) => {
                              if (index < star) s.classList.add("selected");
                              else s.classList.remove("selected");
                            });
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <input
                      type="hidden"
                      id={`return-rating-${req._id}`}
                      value="0"
                    />
                  </label>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '-10px' }}>
                    Click stars to rate (optional)
                  </div>
                  <label>
                    Comment (optional):
                    <textarea
                      id={`return-comment-${req._id}`}
                      rows="4"
                      placeholder="Share your thoughts about the book..."
                    />
                  </label>
                </div>
                <div className="modal-actions">
                  <button
                    className="accept-btn"
                    onClick={async () => {
                      const rating = document.getElementById(`return-rating-${req._id}`).value;
                      const comment = document.getElementById(`return-comment-${req._id}`).value;

                      // Submit feedback if both rating and comment are provided
                      if (rating > 0 && comment.trim()) {
                        try {
                          await axios.post("http://localhost:3000/api/feedback/submit", {
                            swapRequestId: req._id,
                            fromUserId: userId,
                            rating: parseInt(rating),
                            comment: comment.trim(),
                            type: "book",
                          });
                          showToast("Feedback submitted ✅");
                        } catch (err) {
                          console.error("Error submitting feedback:", err);
                          showToast("Error submitting feedback ❌");
                          return;
                        }
                      }

                      // Proceed with return
                      handleAction(req._id, "return");
                      const modal = document.getElementById(`return-feedback-modal-${req._id}`);
                      if (modal) modal.style.display = 'none';
                    }}
                  >
                    Return Book
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      const modal = document.getElementById(`return-feedback-modal-${req._id}`);
                      if (modal) modal.style.display = 'none';
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {showComplaintForm && selectedRequestForComplaint && (
        <ComplaintForm
          swapRequest={selectedRequestForComplaint}
          onClose={() => {
            setShowComplaintForm(false);
            setSelectedRequestForComplaint(null);
          }}
          onSubmit={() => {
            showToast("Complaint submitted successfully ✅");
            setShowComplaintForm(false);
            setSelectedRequestForComplaint(null);
          }}
        />
      )}
    </div>
  );
};

export default SwapRequests;
