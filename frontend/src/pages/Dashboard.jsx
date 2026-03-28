import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";
import BookCard from "../components/BookCard";
import Navbar from "../components/Navbar";
import MyWishlist from "./MyWishlist";
import AddBook from "./AddBook";
import MyBooks from "./MyBooks";
import SwapRequests from "./SwapRequests"; // new page
import ContactUs from "./ContactUs"; // new page

const Dashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [activePage, setActivePage] = useState("home"); // track current page
  const [books, setBooks] = useState([]); // all books from database
  const [swapStats, setSwapStats] = useState({ activeSwaps: 0, swapLimit: 1 }); // swap limit stats
  const userId = localStorage.getItem("userId");

  // Fetch all books from backend
  const fetchBooks = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/books");
      setBooks(res.data);
    } catch (err) {
      console.error("Error fetching books:", err);
    }
  };

  // Fetch user's swap stats
  const fetchSwapStats = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/swapRequests/active-count/${userId}`);
      setSwapStats(res.data);
    } catch (err) {
      console.error("Error fetching swap stats:", err);
    }
  };

  // Refresh books when swap request is made or accepted
  const refreshBooks = () => {
    fetchBooks();
  };

  useEffect(() => {
    fetchBooks();
    fetchSwapStats();

    // Poll for new books every 5 seconds
    const interval = setInterval(fetchBooks, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleBookAdded = (newBook) => {
    fetchBooks(); // refetch to update dashboard
  };

  const genres = ["All", ...new Set(books.map((book) => book.genre))];

  const filteredBooks = books.filter((book) => {
    const matchesGenre = genreFilter === "All" || book.genre === genreFilter;
    const matchesSearch = book.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <Navbar toggleMenu={toggleMenu} menuOpen={menuOpen} />

      {/* Sidebar */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <ul>
          <li className={activePage === "home" ? "active" : ""} onClick={() => setActivePage("home")}>Home</li>
          <li className={activePage === "wishlist" ? "active" : ""} onClick={() => setActivePage("wishlist")}>My Wishlist</li>
          <li className={activePage === "myBooks" ? "active" : ""} onClick={() => setActivePage("myBooks")}>My Books</li>
          <li className={activePage === "swapRequests" ? "active" : ""} onClick={() => setActivePage("swapRequests")}>Swap Requests</li>
          <li className={activePage === "addBook" ? "active" : ""} onClick={() => setActivePage("addBook")}>Add Book</li>
          <li className={activePage === "contactUs" ? "active" : ""} onClick={() => setActivePage("contactUs")}>Contact Us</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className={`main-content ${menuOpen ? "shifted" : ""}`}>
        {/* Home Page */}
        {activePage === "home" && (
          <>
            
            <div className="search-filter-bar">
              <input
                type="text"
                placeholder="Search books by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="genre-select"
              >
                {genres.map((g, i) => (
                  <option key={i} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="book-grid">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book) => (
                  <BookCard
                    key={book._id}
                    book={book}
                    showToast={showToast}
                    refreshBooks={refreshBooks}
                    swapLimitReached={swapStats.activeSwaps >= swapStats.swapLimit}
                  />
                ))
              ) : (
                <p className="no-books">No books found 📚</p>
              )}
            </div>
          </>
        )}

        {/* Wishlist Page */}
        {activePage === "wishlist" && <MyWishlist showToast={showToast} refreshBooks={refreshBooks} />}

        {/* Add Book Page */}
        {activePage === "addBook" && <AddBook onBookAdded={handleBookAdded} showToast={showToast} />}

        {/* My Books Page */}
        {activePage === "myBooks" && <MyBooks showToast={showToast} />}

        {/* Swap Requests Page */}
        {activePage === "swapRequests" && <SwapRequests showToast={showToast} refreshBooks={refreshBooks} onSwapAction={() => fetchSwapStats()} />}

        {/* Contact Us Page */}
        {activePage === "contactUs" && <ContactUs showToast={showToast} />}
      </div>

      {/* Toast */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </div>
  );
};

export default Dashboard;