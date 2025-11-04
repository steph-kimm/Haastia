import React from "react";
import "./Home.css";

const Home = () => {
  return (
    <div className="homepage">
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>Manage Your Beauty Business With Ease</h1>
          <p>
            Scheduling, client management, and growth tools — all in one simple
            platform designed for professionals like you.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">Get Started</button>
            <button className="btn-secondary">Watch Demo</button>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1581092787760-d221e6b84a61?auto=format&fit=crop&w=800&q=80"
            alt="Scheduling Dashboard"
          />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <h2>Everything You Need to Run Your Business</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>📅 Smart Scheduling</h3>
            <p>
              Manage appointments seamlessly with built-in availability and
              reminders.
            </p>
          </div>
          <div className="feature-card">
            <h3>👥 Client Management</h3>
            <p>
              Keep notes, preferences, and contact info in one organized place.
            </p>
          </div>
          <div className="feature-card">
            <h3>💅 Custom Services</h3>
            <p>
              Add your services, set durations and prices — customize your
              offerings easily.
            </p>
          </div>
          <div className="feature-card">
            <h3>📱 Mobile Friendly</h3>
            <p>
              Stay connected anywhere with a fully responsive design on all
              devices.
            </p>
          </div>
        </div>
      </section>

      {/* DEMO SECTION */}
      <section className="demo">
        <div className="demo-content">
          <h2>See How It Works</h2>
          <p>
            Watch how Haastia helps you save time and grow your client base with
            simple scheduling and management tools.
          </p>
          <button className="btn-primary">Try It Free</button>
        </div>
        <div className="demo-image">
          <img
            src="https://images.unsplash.com/photo-1619978899730-fd7c9c9b5f5e?auto=format&fit=crop&w=800&q=80"
            alt="App Demo"
          />
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="pricing">
        <h2>Simple Pricing</h2>
        <div className="pricing-card">
          <h3>Launch Plan</h3>
          <p className="price">$9<span>/month</span></p>
          <p>All core features included. Cancel anytime.</p>
          <button className="btn-primary">Start Free</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p>© 2025 Haastia. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">FAQ</a>
          <a href="#">Contact</a>
          <a href="#">Privacy</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
