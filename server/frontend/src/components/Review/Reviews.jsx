import React from "react";

const sentimentClass = (sentiment) => {
  const value = (sentiment || "neutral").toLowerCase();
  if (value === "positive") return "tag tag--positive";
  if (value === "negative") return "tag tag--negative";
  return "tag tag--neutral";
};

function Reviews({ reviews }) {
  return (
    <div className="panel">
      <div className="panel__head">
        <h2>Customer reviews</h2>
        <span className="tag">{reviews.length} reviews</span>
      </div>

      {reviews.length === 0 && (
        <div className="empty-state">
          <h3>No reviews yet</h3>
          <p>Be the first customer to review this dealership.</p>
        </div>
      )}

      {reviews.map((review) => (
        <article className="review-item" key={review.id}>
          <div className="review-item__head">
            <img
              src={`/static/images/reviewer-${(review.id % 3) + 1}.jpg`}
              alt={review.name}
            />
            <div className="review-item__who">
              <strong>{review.name}</strong>
              <span>{(review.created_at || "").slice(0, 10)}</span>
            </div>
            <span className={sentimentClass(review.sentiment) + " sentiment"}>
              {review.sentiment}
            </span>
          </div>
          <p>{review.review}</p>
          <div className="review-tags">
            {review.purchase ? (
              <span className="tag">
                Purchased {review.car_year} {review.car_make} {review.car_model}
              </span>
            ) : (
              <span className="tag">Showroom visit</span>
            )}
            <span className="tag">Verified customer</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export default Reviews;
