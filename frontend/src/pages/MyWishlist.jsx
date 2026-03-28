

import React, { useEffect, useState } from "react";
import axios from "axios";
import BookCard from "../components/BookCard";
import "./MyWishlist.css";

const MyWishlist = ({ showToast, refreshBooks }) => {
  const [wishlist, setWishlist] = useState([]);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    const fetchWishlist = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/wishlist/${userId}`);
        setWishlist(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchWishlist();
  }, [userId]);

  const handleRemove = async (bookId) => {
    try {
      await axios.delete("http://localhost:3000/api/wishlist/remove", {
        data: { userId, bookId },
      });
      setWishlist((prev) => prev.filter((b) => b._id !== bookId));
      showToast("Removed from wishlist 💔");
      // No page reload needed
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="wishlist-page">
      <h2>My Wishlist </h2>
      {wishlist.length === 0 ? (
        <p>No books in wishlist yet 📚</p>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((book, idx) => (
            <BookCard
              key={idx}
              book={{
                _id: book._id || idx,
                cover: book.cover,
                title: book.title,
                author: book.author,
                genre: book.genre,
                userId: book.userId,
                status: book.status || "available"
              }}
              showToast={showToast}
              page="wishlist"
              refreshBooks={refreshBooks}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyWishlist;


