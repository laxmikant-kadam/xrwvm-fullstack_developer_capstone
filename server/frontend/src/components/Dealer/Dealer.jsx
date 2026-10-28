import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDealer } from "../../services/api";
import Reviews from "../Review/Reviews";
import ReviewForm from "../Review/ReviewForm";

function Dealer({ session }) {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getDealer(id)
      .then((data) => {
        setDealer(data.dealer);
        setReviews(data.reviews || []);
      })
      .catch(() => setError("Dealership not found."));
  }, [id]);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h2>{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="dealer-hero">
        <div className="container">
          <div className="dealer-hero__inner">
            <div>
              <h1>{dealer ? dealer.full_name : "Loading dealership..."}</h1>
              <div className="dealer-hero__meta">
                {dealer && (
                  <span>
                    {dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}
                  </span>
                )}
              </div>
            </div>
            <a className="btn btn--primary" href="#write-review">
              Review Dealer
            </a>
          </div>
        </div>
      </section>

      <div className="section section--tight">
        <div className="container">
          <div className="detail-grid">
            <div>
              <Reviews reviews={reviews} />
              <ReviewForm
                dealerId={id}
                session={session}
                onSubmitted={load}
              />
            </div>
            <aside>
              <div className="panel">
                <div className="panel__head">
                  <h2>Dealership information</h2>
                </div>
                <ul className="info-list">
                  {dealer && (
                    <>
                      <li><span>Dealer ID</span><span>#{dealer.id}</span></li>
                      <li><span>Branch</span><span>{dealer.short_name}</span></li>
                      <li><span>Address</span><span>{dealer.address}</span></li>
                      <li><span>City</span><span>{dealer.city}</span></li>
                      <li><span>State</span><span>{dealer.state}</span></li>
                      <li><span>ZIP</span><span>{dealer.zip}</span></li>
                    </>
                  )}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dealer;
