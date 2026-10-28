/* Shared helpers: API access, session state and small render utilities. */
(function () {
  "use strict";

  const CarsApp = {};

  CarsApp.api = async function (path, options) {
    const response = await fetch(path, Object.assign({ credentials: "same-origin" }, options || {}));
    if (!response.ok) {
      let message = "Request failed (" + response.status + ")";
      try {
        const body = await response.json();
        message = body.message || body.detail || message;
      } catch (error) {
        /* ignore */
      }
      throw new Error(message);
    }
    return response.json();
  };

  CarsApp.csrfToken = function () {
    const match = document.cookie.match(/(^|;)\s*csrftoken=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : "";
  };

  CarsApp.postJSON = function (path, payload) {
    return CarsApp.api(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": CarsApp.csrfToken(),
      },
      body: JSON.stringify(payload),
    });
  };

  CarsApp.escape = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character];
    });
  };

  CarsApp.slug = function (value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  };

  CarsApp.dealerImage = function (dealer) {
    const slug = CarsApp.slug(dealer.short_name || dealer.city || "");
    return "/static/images/dealer-" + slug + ".jpg";
  };

  CarsApp.stars = function (rating) {
    let html = '<span class="stars">';
    for (let index = 1; index <= 5; index += 1) {
      html +=
        '<svg viewBox="0 0 24 24"><path d="M12 17.3l-6.2 3.7 1.6-7-5.4-4.7 7.1-.6L12 2l2.9 6.7 7.1.6-5.4 4.7 1.6 7z" ' +
        (index <= Math.round(rating) ? "" : 'fill="#e2e8f0"') +
        "></path></svg>";
    }
    return html + "</span>";
  };

  CarsApp.sentimentClass = function (sentiment) {
    const value = String(sentiment || "neutral").toLowerCase();
    if (value === "positive") return "tag tag--positive";
    if (value === "negative") return "tag tag--negative";
    return "tag tag--neutral";
  };

  CarsApp.sentimentLabel = function (sentiment) {
    const value = String(sentiment || "neutral").toLowerCase();
    if (value === "positive") return "Positive sentiment";
    if (value === "negative") return "Negative sentiment";
    return "Neutral sentiment";
  };

  CarsApp.ratingFromReviews = function (reviews) {
    if (!reviews || !reviews.length) return 4.5;
    const scores = reviews.map(function (review) {
      const value = String(review.sentiment || "neutral").toLowerCase();
      if (value === "positive") return 5;
      if (value === "negative") return 2;
      return 3.5;
    });
    return scores.reduce(function (a, b) { return a + b; }, 0) / scores.length;
  };

  CarsApp.initials = function (name) {
    return String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0); })
      .join("")
      .toUpperCase();
  };

  /* --------------------------------------------------------------- session */
  CarsApp.session = async function () {
    try {
      return await CarsApp.api("/djangoapp/session");
    } catch (error) {
      return { authenticated: false, userName: "" };
    }
  };

  CarsApp.renderAuthNav = async function () {
    const holder = document.querySelector("[data-auth-nav]");
    if (!holder) return null;
    const session = await CarsApp.session();

    if (session.authenticated) {
      holder.innerHTML =
        '<div class="nav__user">' +
        '<span class="avatar">' + CarsApp.escape(CarsApp.initials(session.userName)) + "</span>" +
        '<span class="hello">Signed in as <strong data-username>' + CarsApp.escape(session.userName) + "</strong></span>" +
        "</div>" +
        '<a class="btn btn--ghost btn--sm" href="/logout/">Logout</a>';
    } else {
      holder.innerHTML =
        '<a class="btn btn--ghost btn--sm" href="/login/">Login</a>' +
        '<a class="btn btn--primary btn--sm" href="/register/">Sign Up</a>';
    }
    return session;
  };

  window.CarsApp = CarsApp;

  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector("[data-auth-nav]")) {
      CarsApp.renderAuthNav();
    }
  });
})();
