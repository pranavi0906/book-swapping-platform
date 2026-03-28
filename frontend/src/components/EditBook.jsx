import React, { useState, useEffect } from "react";
import axios from "axios";
import "./EditBook.css";

const EditBook = ({ book, onClose, onBookUpdated, showToast }) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    genre: "",
    cover: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || "",
        author: book.author || "",
        genre: book.genre || "",
        cover: book.cover || "",
      });
    }
  }, [book]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `http://localhost:3000/api/books/update/${book._id}`,
        formData
      );

      showToast("Book updated successfully! ✅");
      onBookUpdated(response.data.book);
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Failed to update book 😢");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Trigger form submission without confirmation
    const form = document.querySelector('.edit-book-form');
    if (form) {
      form.requestSubmit();
    }
  };

  if (!book) return null;

  return (
    <div className="edit-book-modal-overlay" onClick={onClose}>
      <div className="edit-book-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-book-header">
          <h3>Edit Book</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-book-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">Author</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="genre">Genre</label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
              placeholder="Enter genre"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cover">Cover Image URL</label>
            <input
              type="text"
              id="cover"
              name="cover"
              value={formData.cover}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg or /images/book.jpg"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleSave} disabled={loading} className="save-btn">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBook;
