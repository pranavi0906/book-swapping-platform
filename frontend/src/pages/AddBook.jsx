 import React, { useState } from "react";
import axios from "axios";
import "./AddBook.css";
const AddBook = ({ onBookAdded, showToast }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [cover, setCover] = useState("");

  const userId = localStorage.getItem("userId");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !author || !genre || !cover) {
      showToast("Please fill all fields 📌");
      return;
    }

    try {
      const newBook = { title, author, genre, cover, userId };
      const res = await axios.post("http://localhost:3000/api/books/add", newBook);

      onBookAdded(res.data); // update parent dashboard
      showToast("Book added successfully ✅");

      // clear form
      setTitle("");
      setAuthor("");
      setGenre("");
      setCover("");
    } catch (err) {
      console.error(err);
      showToast("Error adding book ❌");
    }
  };

  return (
    <div className="add-book-page">
      <h2>Add a New Book 📖</h2>
      <form className="add-book-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Book Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          type="text"
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        />
        <input
          type="text"
          placeholder="Cover Image URL"
          value={cover}
          onChange={(e) => setCover(e.target.value)}
        />
        <button type="submit">Add Book ➕</button>
      </form>
    </div>
  );
};

export default AddBook;
