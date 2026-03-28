import React, { useState } from "react";
import axios from "axios";
import "./RequestCard.css";
import Feedback from "./Feedback";

const RequestCard = ({ req, type, onAction, userId }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptDetails, setAcceptDetails] = useState({
    place: "",
    time: "",
    dueDate: ""
  });
  const { bookId, requesterId, status, _id, dueDate, returnRequested, returnAccepted, feedbackDeadline, borrowerFeedbackSubmitted, ownerFeedbackSubmitted } = req;

  if (!bookId) {
    return null; // Skip rendering if bookId is null
  }

  const handleSetDueDate = async () => {
    if (!selectedDate) return;
    try {
      await axios.put(`http://localhost:3000/api/swapRequests/set-due-date/${_id}`, {
        dueDate: selectedDate
      });
      setShowDatePicker(false);
      // Refresh the page to show updated due date
      window.location.reload();
    } catch (err) {
      console.error("Error setting due date:", err);
    }
  };

  const handleAcceptRequest = async () => {
    if (!acceptDetails.place || !acceptDetails.time || !acceptDetails.dueDate) {
      alert("Please fill in all details: place, time, and due date.");
      return;
    }
    try {
      await axios.put(`http://localhost:3000/api/swapRequests/update/${_id}`, {
        status: "accepted",
        place: acceptDetails.place,
        time: acceptDetails.time,
        dueDate: acceptDetails.dueDate
      });
      setShowAcceptModal(false);
      setAccepted(true);
      onAction(_id, "accepted");
      // Refresh the page to show updated status
      window.location.reload();
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  // Check if feedback is eligible
  const isBorrower = requesterId._id === userId;
  const isOwner = req.ownerId._id === userId;
  const canGiveFeedback = returnAccepted && feedbackDeadline && new Date() <= new Date(feedbackDeadline) &&
    ((isBorrower && !borrowerFeedbackSubmitted) || (isOwner && !ownerFeedbackSubmitted));

  return (
    <div className="request-card">
      <img src={bookId.cover} alt={bookId.title} />
      <div className="info">
        <h4>{bookId.title}</h4>
        <p>By {bookId.author}</p>
        <p>Status: <strong>{status}</strong></p>
        {dueDate && <p className="due-date">Due Date: <strong>{new Date(dueDate).toLocaleDateString()}</strong></p>}
        {req.overdueStatus === "overdue" && (
          <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ OVERDUE - Please return immediately!</p>
        )}
        {req.overdueStatus === "lost" && (
          <p style={{ color: 'darkred', fontWeight: 'bold' }}>🚫 BOOK MARKED AS LOST</p>
        )}
        {returnRequested && !returnAccepted && <p><strong>Book Return Requested</strong></p>}
        {returnAccepted && <p><strong>Book Return Accepted</strong></p>}
        {canGiveFeedback && (
          <button onClick={() => setShowFeedback(true)} className="feedback-btn">
            Give Feedback
          </button>
        )}

        {type === "received" && (
          <>
            <button onClick={() => setShowInfo(!showInfo)}>Info</button>
            {showInfo && (
              <div className="user-info">
                <p><b>{requesterId.username}</b></p>
                <p>ID: {requesterId.studentId}</p>
                <p>Email: {requesterId.email}</p>
              </div>
            )}
            <div className="actions">
              <button onClick={() => setShowAcceptModal(true)} className={`accept-btn ${accepted ? "accepted" : (rejected || status !== "pending") ? "disabled" : ""}`} disabled={accepted || rejected || status !== "pending"}>
                {accepted || status === "accepted" ? "Accepted" : "Accept"}
              </button>
              <button onClick={() => { onAction(_id, "rejected"); setRejected(true); }} className={`reject-btn ${rejected ? "rejected" : (accepted || status !== "pending") ? "disabled" : ""}`} disabled={accepted || rejected || status !== "pending"}>
                {rejected || status === "rejected" ? "Rejected" : "Reject"}
              </button>
              {status === "accepted" && !dueDate && (
                <div className="due-date-section">
                  <button onClick={() => setShowDatePicker(!showDatePicker)} className="set-due-date-btn">
                    Set Due Date
                  </button>
                  {showDatePicker && (
                    <div className="date-picker">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <button onClick={handleSetDueDate} className="confirm-date-btn">
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {type === "sent" && status === "accepted" && !returnRequested && !returnAccepted && (
          <div className="actions">
            <button onClick={() => onAction(_id, "return")} className="accept-btn">
              Return Book
            </button>
          </div>
        )}

        {type === "return" && (
          <div className="actions">
            <p>The borrower has requested to return this book.</p>
            {!returnAccepted && (
              <button onClick={() => onAction(_id, "accept-return")} className="accept-btn">
                Accept Book Return
              </button>
            )}
            {returnAccepted && (
              <>
                <p>Book Return accepted ✅</p>
                <button onClick={() => onAction(_id, "complete-return")} className="accept-btn">
                  Book Returned Successfully
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {showFeedback && (
        <Feedback
          swapRequest={req}
          userId={userId}
          onClose={() => setShowFeedback(false)}
          onSubmit={() => {
            setShowFeedback(false);
            onAction(_id, "feedback-submitted"); // Refresh the requests
          }}
        />
      )}

      {showAcceptModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Accept Swap Request</h3>
            <p>Please provide the exchange details:</p>
            <div className="modal-form">
              <label>
                Place:
                <input
                  type="text"
                  value={acceptDetails.place}
                  onChange={(e) => setAcceptDetails({...acceptDetails, place: e.target.value})}
                  placeholder="e.g., Library Entrance"
                  required
                />
              </label>
              <label>
                Time:
                <input
                  type="time"
                  value={acceptDetails.time}
                  onChange={(e) => setAcceptDetails({...acceptDetails, time: e.target.value})}
                  required
                />
              </label>
              <label>
                Due Date:
                <input
                  type="date"
                  value={acceptDetails.dueDate}
                  onChange={(e) => setAcceptDetails({...acceptDetails, dueDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={handleAcceptRequest} className="accept-btn">Accept Request</button>
              <button onClick={() => setShowAcceptModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestCard;
