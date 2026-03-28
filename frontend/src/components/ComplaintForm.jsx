import React, { useState } from "react";
import axios from "axios";
import "./ComplaintForm.css";

const ComplaintForm = ({ swapRequest, onClose, onSubmit }) => {
  const [complaintType, setComplaintType] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintType || !description.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:3000/api/complaints", {
        swapRequestId: swapRequest._id,
        complaintType,
        description: description.trim(),
      });
      onSubmit();
      onClose();
    } catch (err) {
      console.error("Error submitting complaint:", err);
      alert("Error submitting complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content complaint-modal">
        <h3>File a Complaint</h3>
        <p>Complaining about swap with: <strong>{swapRequest.bookId?.title}</strong></p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Complaint Type:</label>
            <select
              value={complaintType}
              onChange={(e) => setComplaintType(e.target.value)}
              required
            >
              <option value="">Select complaint type</option>
              <option value="book_condition">Book Condition Issues</option>
              <option value="late_return">Late Return</option>
              <option value="no_show">No Show for Exchange</option>
              <option value="damaged_book">Book Returned Damaged</option>
              <option value="wrong_book">Wrong Book Provided</option>
              <option value="inappropriate_behavior">Inappropriate Behavior</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about your complaint..."
              rows="4"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Complaint"}
            </button>
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;
