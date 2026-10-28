import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/api";
import "./Register.css";

const initialForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
};

/**
 * Sign-up page of the Cars Dealership React application.
 * Five input fields: Username, First Name, Last Name, Email and Password,
 * followed by the Register button.
 */
function Register({ onRegister }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await registerUser({
        userName: form.username,
        firstName: form.first_name,
        lastName: form.last_name,
        email: form.email,
        password: form.password,
      });
      if (onRegister) onRegister(data);
      navigate("/");
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        "Registration failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-card__title">Sign up</h2>
        <p className="register-card__subtitle">
          Create your Cars Dealership account to review your local dealership.
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-control"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              className="form-control"
              placeholder="Enter your first name"
              value={form.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              className="form-control"
              placeholder="Enter your last name"
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary register-form__submit"
            disabled={submitting}
          >
            {submitting ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="register-card__foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
