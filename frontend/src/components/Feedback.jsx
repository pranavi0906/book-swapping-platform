import React, { useState } from "react";
import axios from "axios";
import "./Feedback.css";

const Feedback = ({ swapRequest, userId, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const isBorrower = swapRequest.requesterId._id === userId;
  const type = isBorrower ? "book" : "borrower";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) {
      alert("Please provide a rating and comment.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:3000/api/feedback/submit", {
        swapRequestId: swapRequest._id,
        fromUserId: userId,
        rating,
        comment,
        type,
      });
      onSubmit();
      onClose();
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Error submitting feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-modal">
      <div className="feedback-content">
        <h3>Give Feedback</h3>
        <p>
          {isBorrower
            ? `Rate the book "${swapRequest.bookId.title}" and its condition.`
            : `Rate the borrower "${swapRequest.requesterId.username}" on timeliness, care, and communication.`
          }
        </p>
        <form onSubmit={handleSubmit}>
          <div className="rating-section">
            <label>Rating (1-5 stars):</label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${rating >= star ? "selected" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="comment-section">
            <label htmlFor="comment">Comment:</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              required
            />
          </div>
          <div className="feedback-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
