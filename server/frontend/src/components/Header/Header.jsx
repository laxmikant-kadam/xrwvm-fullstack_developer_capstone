import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/api";

function Header({ session, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path || (path === "/" && location.pathname === "/dealers");

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      if (onLogout) onLogout();
      navigate("/");
    }
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" to="/">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M18.9 6.2A2 2 0 0017 5H7a2 2 0 00-1.9 1.2L3.5 10H2v7h2v-2h16v2h2v-7h-1.5zM6.5 14A1.5 1.5 0 118 12.5 1.5 1.5 0 016.5 14zm11 0a1.5 1.5 0 111.5-1.5 1.5 1.5 0 01-1.5 1.5zM5.6 9l1.2-2.4h10.4L18.4 9z" />
            </svg>
          </span>
          <span className="brand__text">
            <strong>Cars Dealership</strong>
            <span>National Car Retailer</span>
          </span>
        </Link>

        <nav className="nav" aria-label="Main navigation">
          <Link className={"nav__link" + (isActive("/") ? " is-active" : "")} to="/">
            Home
          </Link>
          <a className="nav__link" href="/about/">
            About Us
          </a>
          <a className="nav__link" href="/contact/">
            Contact Us
          </a>

          <div className="nav__auth">
            {session && session.authenticated ? (
              <>
                <span className="nav__user">
                  <span className="avatar">{session.userName?.slice(0, 2).toUpperCase()}</span>
                  <span>Signed in as <strong>{session.userName}</strong></span>
                </span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn--ghost btn--sm" to="/login">
                  Login
                </Link>
                <Link className="btn btn--primary btn--sm" to="/register">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
