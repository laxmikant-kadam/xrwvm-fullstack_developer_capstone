import React from "react";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>Cars Dealership</h4>
            <p>
              A national car retailer headquartered in Wichita, Kansas, with
              branches across the United States.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul className="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about/">About Us</a></li>
              <li><a href="/contact/">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul className="footer-links">
              <li><a href="/login">Login</a></li>
              <li><a href="/register">Register</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul className="footer-links">
              <li>5150 N Webb Road, Wichita, KS 67208</li>
              <li><a href="tel:+18002277872">1-800-CARS-USA</a></li>
              <li><a href="mailto:support@carsdealership.com">support@carsdealership.com</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Cars Dealership. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
