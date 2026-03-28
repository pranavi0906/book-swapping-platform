

import React, { useState, useEffect } from "react";
import axios from "axios";
import "./BookCard.css";

const BookCard = ({ book, showToast, page = "dashboard", refreshBooks, onEdit, onRemove, swapLimitReached = false }) => {
  const { _id, cover, title, author, genre, userId, status: bookStatus } = book;
  const [liked, setLiked] = useState(false);
  const [status, setStatus] = useState(null);
  const [swapDetails, setSwapDetails] = useState(null);
  const [imageSrc, setImageSrc] = useState(`http://localhost:3000/api/books/image-proxy?url=${encodeURIComponent(cover)}`);
  const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  const currentUserId = localStorage.getItem("userId");
  const [feedbacks, setFeedbacks] = useState([]);
  const [averageRating, setAverageRating] = useState(0);


  useEffect(() => {
    if (!currentUserId) return;
    const checkWishlist = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/wishlist/${currentUserId}`);
        const isInWishlist = res.data.some((b) => b._id === _id);
        setLiked(isInWishlist);
      } catch (err) {
        console.error(err);
      }
    };
    checkWishlist();

    // Check for pending swap requests
    const checkPendingRequests = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/swapRequests/${currentUserId}`);
        const pendingReq = res.data.find(r => r.bookId && r.bookId._id === _id && r.status === "pending");
        if (pendingReq) {
          setStatus("pending");
        }
      } catch (err) {
        console.error("Error fetching pending requests:", err);
      }
    };
    checkPendingRequests();

    // If book is swapped, fetch swap details
    if (bookStatus === "swapped") {
      const fetchSwapDetails = async () => {
        try {
          const res = await axios.get(`http://localhost:3000/api/swapRequests/${currentUserId}`);
          const swapReq = res.data.find(r => r.bookId && r.bookId._id === _id && r.status === "accepted");
          if (swapReq) {
            setSwapDetails(swapReq);
          }
        } catch (err) {
          console.error("Error fetching swap details:", err);
        }
      };
      fetchSwapDetails();
    }
  }, [currentUserId, _id, bookStatus]);

  // Fetch feedbacks for the book
  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/feedback/book/${_id}`);
        setFeedbacks(res.data.feedbacks);
        setAverageRating(res.data.averageRating);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
      }
    };
    fetchFeedbacks();
  }, [_id]);

  // Refresh feedbacks after feedback submission
  const refreshFeedbacks = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/feedback/book/${_id}`);
      setFeedbacks(res.data.feedbacks);
      setAverageRating(res.data.averageRating);
    } catch (err) {
      console.error("Error refreshing feedbacks:", err);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      showToast("Please log in to add to wishlist");
      return;
    }

    const newLikedState = !liked;
    setLiked(newLikedState);

    try {
      if (newLikedState) {
        await axios.post("http://localhost:3000/api/wishlist/add", {
          userId: currentUserId,
          bookId: _id,
        });
        showToast("Added to wishlist ❤️");
      } else {
        await axios.delete("http://localhost:3000/api/wishlist/remove", {
          data: { userId: currentUserId, bookId: _id },
        });
        showToast("Removed from wishlist 💔");
      }
    } catch (err) {
      showToast("Error updating wishlist 😢");
    }
  };

  const handleSwap = async () => {
    if (userId === currentUserId) {
      showToast("You can't request your own book 🚫");
      return;
    }

    if (page === "wishlist") {
      const confirmed = window.confirm("Are you sure you want to request this swap?");
      if (!confirmed) return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/swapRequests/add", {
        requesterId: currentUserId,
        bookId: _id,
      });
      setStatus("pending");
      showToast("Swap request sent 🔄");
      // No need to refresh books here, as the status is set locally
    } catch (err) {
      showToast(err.response?.data?.message || "Error sending request ❌");
    }
  };

  const handleReturn = async () => {
    if (!swapDetails) return;
    try {
      await axios.put(`http://localhost:3000/api/swapRequests/return/${swapDetails._id}`);
      showToast("Return request sent 📤");
      setSwapDetails({ ...swapDetails, returnRequested: true });
    } catch (err) {
      showToast("Error requesting return ❌");
    }
  };

  const handleRemove = async () => {
    const confirmed = window.confirm("The book will be removed permanently. Are you sure?");
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:3000/api/books/delete/${_id}`);
      showToast("Book removed successfully 🗑️");
      if (refreshBooks) refreshBooks();
    } catch (err) {
      showToast("Error removing book ❌");
    }
  };



  return (
    <div className="book-card">
      {userId._id !== currentUserId && (
        <div className="wishlist-icon" onClick={handleLike} style={{ color: liked ? "red" : "white" }}>
          {liked ? "❤️" : "🤍"}
        </div>
      )}
      <img
        src={imageSrc}
        alt={title}
        onError={() => setImageSrc(placeholder)}
      />
      <div className="book-info">
        <div className="scrollable-content">
          <div className="info-section">
            <h4>{title}</h4>
            <p>Author: {author}</p>
            <p>Genre: {genre}</p>
            {averageRating > 0 && (
              <div className="rating-display">
                <div className="rating-header">
                  <span className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= Math.round(averageRating) ? "filled" : ""}`}
                      >
                        ★
                      </span>
                    ))}
                  </span>
                  <span className="rating-text">({averageRating.toFixed(1)})</span>
                </div>
                {feedbacks.length > 0 && (
                  <div className="feedback-comments">
                    {feedbacks.slice(0, 2).map((feedback) => (
                      <div key={feedback._id} className="feedback-comment-item">
                        <span className="comment-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${star <= feedback.rating ? "filled" : ""}`}
                            >
                              ★
                            </span>
                          ))}
                        </span>
                        <span className="comment-text">"{feedback.comment}"</span>
                      </div>
                    ))}
                    {feedbacks.length > 2 && (
                      <p className="more-comments">+{feedbacks.length - 2} more comments</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {userId._id !== currentUserId && (
            <div className="actions-section">
              {page === "dashboard" && bookStatus !== "swapped" && (
                <>
                  {bookStatus === "swapped" ? (
                    <p className="not-available-text">Not Available</p>
                  ) : (
                    <button className="swap-btn" onClick={handleSwap} disabled={status === "pending" || swapLimitReached}>
                      {status === "pending" ? "Requested 🔄" : swapLimitReached ? "Swap Limit Reached" : "Request Swap"}
                    </button>
                  )}
                </>
              )}
              {page === "dashboard" && bookStatus === "swapped" && (
                <>
                  {swapDetails && swapDetails.dueDate && (
                    <p className="due-date-text">Due: {new Date(swapDetails.dueDate).toLocaleDateString()}</p>
                  )}
                  {swapDetails && swapDetails.overdueStatus === "overdue" && (
                    <p className="overdue-warning" style={{ color: 'red', fontWeight: 'bold' }}>
                      ⚠️ OVERDUE - Please return immediately!
                    </p>
                  )}
                  {swapDetails && swapDetails.overdueStatus === "lost" && (
                    <p className="lost-warning" style={{ color: 'darkred', fontWeight: 'bold' }}>
                      🚫 BOOK MARKED AS LOST
                    </p>
                  )}
                  {swapDetails && swapDetails.requesterId._id === currentUserId && !swapDetails.returnRequested && !swapDetails.returnAccepted && (
                    <button className="swap-btn" onClick={handleReturn}>Return Book</button>
                  )}
                  {swapDetails && swapDetails.returnRequested && !swapDetails.returnAccepted && (
                    <p className="status">Book Return Requested</p>
                  )}
                  {swapDetails && swapDetails.returnAccepted && (
                    <p className="status">Book Return Accepted</p>
                  )}
                </>
              )}
              {page === "wishlist" && bookStatus !== "swapped" && (
                <>
                  {bookStatus === "swapped" ? (
                    <p className="not-available-text">Not Available</p>
                  ) : (
                    <button className="swap-btn" onClick={handleSwap} disabled={status === "pending" || swapLimitReached}>
                      {status === "pending" ? "Requested 🔄" : swapLimitReached ? "Swap Limit Reached" : "Request Swap"}
                    </button>
                  )}
                </>
              )}
              {page === "wishlist" && bookStatus === "swapped" && (
                <>
                  {swapDetails && swapDetails.dueDate && (
                    <p className="due-date-text">Due: {new Date(swapDetails.dueDate).toLocaleDateString()}</p>
                  )}
                  {swapDetails && swapDetails.requesterId._id === currentUserId && !swapDetails.returnRequested && !swapDetails.returnAccepted && (
                    <button className="swap-btn" onClick={handleReturn}>Return Book</button>
                  )}
                  {swapDetails && swapDetails.returnRequested && !swapDetails.returnAccepted && (
                    <p className="status">Book Return Requested</p>
                  )}
                  {swapDetails && swapDetails.returnAccepted && (
                    <p className="status">Book Return Accepted</p>
                  )}
                </>
              )}
              {page === "wishlist" && (
                <p className={`status-badge status-badge-${bookStatus}`}>
                  {bookStatus === "available" ? "Available" : bookStatus === "swapped" ? "Swapped" : "Rejected"}
                </p>
              )}
            </div>
          )}

          {userId._id === currentUserId && page === "mybooks" && (
            <>
              <div className="actions-section">
                <div className="book-actions">
                  <button className="edit-btn" onClick={() => onEdit && onEdit(book)}>
                    Edit ✏️
                  </button>
                  <button className="remove-btn" onClick={() => onRemove && onRemove(book)}>
                    Remove 🗑️
                  </button>
                </div>
              </div>

              <div className="feedbacks-section">
                <h4>Feedbacks</h4>
                {feedbacks.length > 0 ? feedbacks.map((feedback) => (
                  <div key={feedback._id} className="feedback-item">
                    <div className="feedback-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`star ${star <= feedback.rating ? "filled" : ""}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="feedback-comment">{feedback.comment}</p>
                    <p className="feedback-from">By: {feedback.fromUserId.username}</p>
                  </div>
                )) : <p>No feedbacks yet.</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;

