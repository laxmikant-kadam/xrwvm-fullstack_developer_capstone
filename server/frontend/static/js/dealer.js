/* Dealer detail page: dealership information, reviews and review submission. */
(function () {
  "use strict";

  const root = document.getElementById("dealer-detail");
  if (!root) return;

  const match = window.location.pathname.match(/\/dealer\/(\d+)/);
  const dealerId = match ? match[1] : root.getAttribute("data-dealer-id");

  const reviewsEl = document.getElementById("reviews-list");
  const summaryEl = document.getElementById("rating-summary");
  const form = document.getElementById("review-form");
  const formHolder = document.getElementById("review-form-holder");
  const alertHolder = document.getElementById("review-alert");
  const heroImage = document.getElementById("dealer-hero-image");
  const heroName = document.getElementById("dealer-hero-name");
  const heroMeta = document.getElementById("dealer-hero-meta");
  const infoList = document.getElementById("dealer-info");

  let session = { authenticated: false, userName: "" };
  let dealer = null;

  function reviewItem(review, index) {
    const avatar = "/static/images/reviewer-" + ((index % 3) + 1) + ".jpg";
    const purchased = review.purchase
      ? '<span class="tag">Purchased ' +
        (review.car_year ? CarsApp.escape(review.car_year) + " " : "") +
        CarsApp.escape(review.car_make || "") + " " + CarsApp.escape(review.car_model || "") +
        (review.purchase_date ? " &middot; " + CarsApp.escape(review.purchase_date) : "") +
        "</span>"
      : '<span class="tag">Showroom visit</span>';

    return (
      '<article class="review-item">' +
      '<div class="review-item__head">' +
      '<img src="' + avatar + '" alt="' + CarsApp.escape(review.name) + '" />' +
      '<div class="review-item__who"><strong>' + CarsApp.escape(review.name) + "</strong>" +
      "<span>" + CarsApp.escape(review.created_at ? review.created_at.slice(0, 10) : "Recently") + "</span></div>" +
      '<span class="' + CarsApp.sentimentClass(review.sentiment) + ' sentiment">' +
      CarsApp.sentimentLabel(review.sentiment) + "</span>" +
      "</div>" +
      "<p>" + CarsApp.escape(review.review) + "</p>" +
      '<div class="review-tags">' + purchased +
      "<span class=\"tag\">Verified customer</span></div>" +
      "</article>"
    );
  }

  function renderReviews(reviews) {
    if (!reviews.length) {
      reviewsEl.innerHTML =
        '<div class="empty-state"><h3>No reviews yet</h3><p>Be the first customer to review this dealership.</p></div>';
      summaryEl.innerHTML = "";
      return;
    }

    const rating = CarsApp.ratingFromReviews(reviews);
    summaryEl.innerHTML =
      "<strong>" + rating.toFixed(1) + "</strong>" +
      "<div>" + CarsApp.stars(rating) +
      "<div><span>" + reviews.length + " verified review" + (reviews.length === 1 ? "" : "s") +
      " &middot; sentiment analysed</span></div></div>";

    reviewsEl.innerHTML = reviews.map(reviewItem).join("");
  }

  function renderDealer(data) {
    dealer = data.dealer;
    document.title = dealer.full_name + " | Cars Dealership";
    heroName.textContent = dealer.full_name;
    if (heroImage) {
      heroImage.src = CarsApp.dealerImage(dealer);
      heroImage.alt = dealer.full_name;
    }
    heroMeta.innerHTML =
      "<span><svg viewBox=\"0 0 24 24\"><path d=\"M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z\"/></svg>" +
      CarsApp.escape(dealer.address) + ", " + CarsApp.escape(dealer.city) + ", " +
      CarsApp.escape(dealer.st || dealer.state) + " " + CarsApp.escape(dealer.zip) + "</span>" +
      "<span><svg viewBox=\"0 0 24 24\"><path d=\"M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11 11 0 003.5.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.56 3.5 1 1 0 01-.25 1z\"/></svg>(316) 555-0" +
      String(100 + Number(dealer.id)).slice(-3) + "</span>" +
      "<span><svg viewBox=\"0 0 24 24\"><path d=\"M12 2a10 10 0 100 20 10 10 0 000-20zm1 10.6V6h-2v7.4l5 3 1-1.7z\"/></svg>Open today 9:00 AM - 8:00 PM</span>";

    infoList.innerHTML =
      "<li><span>Dealer ID</span><span>#" + dealer.id + "</span></li>" +
      "<li><span>Branch</span><span>" + CarsApp.escape(dealer.short_name) + "</span></li>" +
      "<li><span>Address</span><span>" + CarsApp.escape(dealer.address) + "</span></li>" +
      "<li><span>City</span><span>" + CarsApp.escape(dealer.city) + "</span></li>" +
      "<li><span>State</span><span>" + CarsApp.escape(dealer.state) + "</span></li>" +
      "<li><span>ZIP</span><span>" + CarsApp.escape(dealer.zip) + "</span></li>" +
      "<li><span>Coordinates</span><span>" + dealer.lat.toFixed(4) + ", " + dealer.long.toFixed(4) + "</span></li>" +
      "<li><span>Sales</span><span>Mon-Sat 9-8</span></li>" +
      "<li><span>Service</span><span>Mon-Sat 7-6</span></li>";

    renderReviews(data.reviews || []);
  }

  function showAlert(type, message) {
    alertHolder.innerHTML =
      '<div class="alert alert--' + type + '">' + CarsApp.escape(message) + "</div>";
    alertHolder.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setupForm() {
    if (!formHolder) return;

    if (!session.authenticated) {
      formHolder.innerHTML =
        '<div class="empty-state">' +
        "<h3>Login required</h3>" +
        "<p>You need an account to post a review for this dealership.</p>" +
        '<a class="btn btn--primary" href="/login/?next=' + encodeURIComponent(window.location.pathname) +
        '#write-review">Login to post a review</a> ' +
        '<a class="btn btn--ghost" href="/register/">Create an account</a></div>';
      return;
    }

    formHolder.innerHTML =
      '<form class="review-form" id="review-form" novalidate>' +
      '<div class="field-row">' +
      '<div class="field"><label for="review-name">Your name</label>' +
      '<input id="review-name" name="name" type="text" value="' +
      CarsApp.escape(session.userName || "") + '" required /></div>' +
      '<div class="field"><label for="review-email">Email</label>' +
      '<input id="review-email" name="email" type="email" value="' +
      CarsApp.escape(session.email || "") + '" readonly /></div>' +
      "</div>" +
      '<div class="field"><label for="review-text">Your review</label>' +
      '<textarea id="review-text" name="review" placeholder="Tell other customers about your experience with this dealership..." required></textarea></div>' +
      '<label class="checkbox"><input type="checkbox" id="review-purchase" name="purchase" checked /> I purchased a vehicle from this dealership</label>' +
      '<div class="field-row field-row--three">' +
      '<div class="field"><label for="review-date">Purchase date</label>' +
      '<input id="review-date" name="purchase_date" type="date" /></div>' +
      '<div class="field"><label for="review-make">Car make</label>' +
      '<select id="review-make" name="car_make"><option value="">Select make</option></select></div>' +
      '<div class="field"><label for="review-model">Car model</label>' +
      '<input id="review-model" name="car_model" type="text" placeholder="Camry" /></div>' +
      "</div>" +
      '<div class="field-row">' +
      '<div class="field"><label for="review-year">Car year</label>' +
      '<input id="review-year" name="car_year" type="number" min="1990" max="2026" placeholder="2023" /></div>' +
      "</div>" +
      '<p class="form-note">Your review is analysed by the Cars Dealership sentiment service before it is published.</p>' +
      '<div><button class="btn btn--primary" type="submit" id="review-submit">Post Review</button> ' +
      '<a class="btn btn--ghost" href="/">Cancel</a></div>' +
      "</form>";

    const newForm = document.getElementById("review-form");
    newForm.addEventListener("submit", submitReview);
    loadCarMakes();
  }

  async function loadCarMakes() {
    const select = document.getElementById("review-make");
    if (!select) return;
    try {
      const data = await CarsApp.api("/djangoapp/get_cars");
      (data.car_makes || []).forEach(function (make) {
        const option = document.createElement("option");
        option.value = make.name;
        option.textContent = make.name;
        select.appendChild(option);
      });
      select.value = "Toyota";
    } catch (error) {
      /* the field stays optional */
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    const button = document.getElementById("review-submit");
    const payload = {
      dealership: Number(dealerId),
      name: document.getElementById("review-name").value.trim(),
      review: document.getElementById("review-text").value.trim(),
      purchase: document.getElementById("review-purchase").checked,
      purchase_date: document.getElementById("review-date").value,
      car_make: document.getElementById("review-make").value,
      car_model: document.getElementById("review-model").value.trim(),
      car_year: document.getElementById("review-year").value || null,
    };

    if (!payload.name || !payload.review) {
      showAlert("error", "Please enter your name and review text.");
      return;
    }

    button.disabled = true;
    button.textContent = "Posting...";

    try {
      const result = await CarsApp.postJSON("/djangoapp/add_review", payload);
      const sentiment = result.review ? result.review.sentiment : "neutral";
      showAlert("success", "Thank you! Your review was posted with " + sentiment + " sentiment.");
      const data = await CarsApp.api("/djangoapp/get_dealer/" + dealerId);
      renderReviews(data.reviews || []);
      document.getElementById("reviews-list").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      showAlert("error", error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Post Review";
    }
  }

  async function load() {
    session = (await CarsApp.renderAuthNav()) || { authenticated: false, userName: "" };
    try {
      const data = await CarsApp.api("/djangoapp/get_dealer/" + dealerId);
      renderDealer(data);
      setupForm();
    } catch (error) {
      root.innerHTML =
        '<div class="container section"><div class="empty-state"><h2>Dealership not found</h2><p>' +
        CarsApp.escape(error.message) + '</p><a class="btn btn--primary" href="/">Back to all dealerships</a></div></div>';
    }
  }

  load();
})();
