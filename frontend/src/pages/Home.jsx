
import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();

  const trending = [
    {
      title: "The Alchemist",
      author: "Paulo Coelho",
      img: "https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg",
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      img: "https://m.media-amazon.com/images/I/81bGKUa1e0L._AC_UF1000,1000_QL80_.jpg",
    },
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      img: "https://m.media-amazon.com/images/I/41xShlnTZTL._SX374_BO1,204,203,200_.jpg",
    },
  ];

  const renderBooks = (books) =>
    books.map((b, i) => (
      <div key={i} className="book-card">
        <img src={b.img} alt={b.title} />
        <div className="book-info">
          <h4>{b.title}</h4>
          <p>{b.author}</p>
        </div>
      </div>
    ));

  return (
    <div className="home-container">
      {/* Navbar */}
      <header className="navbar">
        <h2>📚 BookSwap</h2>
        <button onClick={() => navigate("/login")}>Get Started →</button>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h1>
            Discover, Swap & <span>Save Books</span> Effortlessly.
          </h1>
          <p>
            Join a vibrant student community to share and explore amazing reads.
            BookSwap makes reading affordable, sustainable, and social.
          </p>
          <button onClick={() => navigate("/login")}>🚀 Get Started</button>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80"
            alt="Book Lovers"
          />
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2>
          Why Students <span>Love BookSwap</span>
        </h2>
        <div className="feature-grid">
          <div className="feature">
            <h3>🎓 Student-Friendly</h3>
            <p>Simple, clean, and built for your campus community.</p>
          </div>
          <div className="feature">
            <h3>💸 Cost-Efficient</h3>
            <p>Save money by swapping instead of buying new books.</p>
          </div>
          <div className="feature">
            <h3>🌱 Sustainable</h3>
            <p>Encourage reuse and reduce waste — read responsibly!</p>
          </div>
        </div>
      </section>

      {/* Trending Books */}
      <section className="trending">
        <h2>🔥 Trending Reads</h2>
        <div className="book-grid">{renderBooks(trending)}</div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to Start Swapping?</h2>
        <p>Join thousands of students making reading affordable and fun.</p>
        <button onClick={() => navigate("/login")}>Get Started Now →</button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <h3>BookSwap</h3>
        <p>Connecting readers • Sharing knowledge • Saving resources</p>
        <small>© 2025 BookSwap | support@bookswap.com</small>
      </footer>
    </div>
  );
}