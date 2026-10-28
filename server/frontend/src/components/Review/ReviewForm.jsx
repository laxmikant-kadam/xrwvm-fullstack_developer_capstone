import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addReview, getCars } from "../../services/api";

const emptyForm = {
  name: "",
  review: "",
  purchase: true,
  purchase_date: "",
  car_make: "Toyota",
  car_model: "",
  car_year: "",
};

function ReviewForm({ dealerId, session, onSubmitted }) {
  const [form, setForm] = useState(emptyForm);
  const [makes, setMakes] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.userName) {
      setForm((previous) => ({ ...previous, name: session.userName }));
    }
  }, [session]);

  useEffect(() => {
    getCars()
      .then((data) => setMakes(data))
      .catch(() => setMakes([]));
  }, []);

  if (!session?.authenticated) {
    return (
      <div className="panel" id="write-review">
        <div className="panel__head">
          <h2>Post a review</h2>
        </div>
        <div className="empty-state">
          <h3>Login required</h3>
          <p>You need an account to post a review for this dealership.</p>
          <Link className="btn btn--primary" to={`/login?next=/dealer/${dealerId}`}>
            Login to post a review
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const data = await addReview({ ...form, dealership: Number(dealerId) });
      setMessage(`Review posted with ${data.review.sentiment} sentiment.`);
      setForm((previous) => ({ ...previous, review: "" }));
      if (onSubmitted) onSubmitted();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to post review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="panel" id="write-review">
      <div className="panel__head">
        <h2>Post a review</h2>
        <span className="tag">Sentiment analysed</span>
      </div>

      {message && <div className="alert alert--success">{message}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <form className="review-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="review-name">Your name</label>
          <input
            id="review-name"
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="review-text">Your review</label>
          <textarea
            id="review-text"
            name="review"
            className="form-control"
            value={form.review}
            onChange={handleChange}
            required
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            name="purchase"
            checked={form.purchase}
            onChange={handleChange}
          />{" "}
          I purchased a vehicle from this dealership
        </label>
        <div className="field-row field-row--three">
          <div className="field">
            <label htmlFor="purchase_date">Purchase date</label>
            <input
              id="purchase_date"
              name="purchase_date"
              type="date"
              className="form-control"
              value={form.purchase_date}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label htmlFor="car_make">Car make</label>
            <select
              id="car_make"
              name="car_make"
              className="form-control"
              value={form.car_make}
              onChange={handleChange}
            >
              {makes.map((make) => (
                <option key={make.id} value={make.name}>
                  {make.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="car_model">Car model</label>
            <input
              id="car_model"
              name="car_model"
              className="form-control"
              value={form.car_model}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="car_year">Car year</label>
          <input
            id="car_year"
            name="car_year"
            type="number"
            className="form-control"
            value={form.car_year}
            onChange={handleChange}
          />
        </div>
        <div>
          <button className="btn btn--primary" type="submit" disabled={submitting}>
            {submitting ? "Posting..." : "Post Review"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReviewForm;
