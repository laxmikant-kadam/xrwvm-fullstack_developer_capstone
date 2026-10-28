import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDealers } from "../../services/api";

const STATES = ["Kansas", "California", "Texas", "New York", "Florida", "Illinois"];

function Dealers({ session }) {
  const { state } = useParams();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDealers(state)
      .then((data) => {
        if (active) {
          setDealers(data);
          setError("");
        }
      })
      .catch(() => active && setError("Unable to load dealerships."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [state]);

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Our dealerships</span>
          <h2>Find a Cars Dealership branch</h2>
          <p>
            Showing <strong>{dealers.length}</strong> dealership
            {dealers.length === 1 ? "" : "s"}
            {state ? ` in ${state}` : " nationwide"}.
          </p>
        </div>

        <div className="chip-row mb-4">
          <Link className={"chip" + (!state ? " is-active" : "")} to="/">All states</Link>
          {STATES.map((name) => (
            <Link
              key={name}
              className={"chip" + (state === name ? " is-active" : "")}
              to={`/dealers/${encodeURIComponent(name)}`}
            >
              {name}
            </Link>
          ))}
        </div>

        {loading && <div className="loading-wrap"><div className="spinner" /></div>}
        {error && <div className="alert alert--error">{error}</div>}

        <div className="dealer-grid">
          {dealers.map((dealer) => (
            <article className="dealer-card" key={dealer.id}>
              <div className="dealer-card__media">
                <img
                  src={`/static/images/dealer-${dealer.short_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.jpg`}
                  alt={dealer.full_name}
                  loading="lazy"
                />
                <span className="badge-state">{dealer.state}</span>
              </div>
              <div className="dealer-card__body">
                <h3>{dealer.full_name}</h3>
                <div className="dealer-card__meta">
                  <span>
                    {dealer.address}
                    <br />
                    {dealer.city}, {dealer.state} {dealer.zip}
                  </span>
                </div>
              </div>
              <div className="dealer-card__actions">
                <Link className="btn btn--primary btn--sm" to={`/dealer/${dealer.id}`}>
                  View Dealer
                </Link>
                {session?.authenticated ? (
                  <Link className="btn btn--ghost btn--sm" to={`/dealer/${dealer.id}#write-review`}>
                    Review Dealer
                  </Link>
                ) : (
                  <Link className="btn btn--ghost btn--sm" to={`/login?next=/dealer/${dealer.id}`}>
                    Login to Review
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Dealers;
