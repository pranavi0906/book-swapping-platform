

import React, { useEffect, useState } from "react";
import axios from "axios";
import BookCard from "../components/BookCard";
import EditBook from "../components/EditBook";
import "./MyBooks.css";

const MyBooks = ({ showToast }) => {
  const [myBooks, setMyBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const userId = localStorage.getItem("userId");

  const fetchMyBooks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:3000/api/books/mybooks/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMyBooks(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch your books ❌");
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
  };

  const handleRemove = async (book) => {
    if (window.confirm("Are you sure you want to remove this book?")) {
      try {
        await axios.delete(`http://localhost:3000/api/books/delete/${book._id}`);
        showToast("Book removed successfully! 🗑️");
        fetchMyBooks(); // Refresh the list
      } catch (err) {
        console.error(err);
        showToast("Failed to remove book 😢");
      }
    }
  };

  const handleBookUpdated = (updatedBook) => {
    setMyBooks((prevBooks) =>
      prevBooks.map((book) =>
        book._id === updatedBook._id ? updatedBook : book
      )
    );
  };

  useEffect(() => {
    fetchMyBooks();
  }, [userId, showToast]);

  return (
    <div className="my-books-page">
      <h2>My Books 📚</h2>
      {myBooks.length === 0 ? (
        <p className="no-books-msg">You haven't added any books yet.</p>
      ) : (
        <div className="my-books-grid">
          {myBooks.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              showToast={showToast}
              page="mybooks"
              onEdit={handleEdit}
              onRemove={handleRemove}
              refreshBooks={fetchMyBooks}
            />
          ))}
        </div>
      )}

      {editingBook && (
        <EditBook
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onBookUpdated={handleBookUpdated}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default MyBooks;


