/* Landing page: dealer list, state filter and authenticated actions. */
(function () {
  "use strict";

  const grid = document.getElementById("dealer-grid");
  if (!grid) return;

  const countEl = document.getElementById("dealer-count");
  const stateSelect = document.getElementById("state-filter");
  const filterForm = document.getElementById("filter-form");
  const chipRow = document.querySelectorAll("[data-state-chip]");

  const STATES = [
    "Kansas", "California", "Texas", "New York", "Florida", "Illinois",
  ];

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function currentState() {
    const value = params().get("state") || "";
    if (!value) return "";
    const match = STATES.find(function (state) {
      return state.toLowerCase() === value.toLowerCase();
    });
    return match || "";
  }

  function dealerCard(dealer, session) {
    const rating = 4.4 + ((dealer.id * 7) % 5) / 10;
    const reviewAction = session.authenticated
      ? '<a class="btn btn--ghost btn--sm" href="/dealer/' + dealer.id + '/#write-review">Review Dealer</a>'
      : '<a class="btn btn--ghost btn--sm" href="/login/?next=/dealer/' + dealer.id + '/#write-review">Login to Review</a>';

    return (
      '<article class="dealer-card">' +
      '<div class="dealer-card__media">' +
      '<img src="' + CarsApp.dealerImage(dealer) + '" alt="' + CarsApp.escape(dealer.full_name) + '" />' +
      '<span class="badge-state">' + CarsApp.escape(dealer.state) + "</span>" +
      '<span class="badge-rating"><svg viewBox="0 0 24 24"><path d="M12 17.3l-6.2 3.7 1.6-7-5.4-4.7 7.1-.6L12 2l2.9 6.7 7.1.6-5.4 4.7 1.6 7z"/></svg>' +
      rating.toFixed(1) + "</span>" +
      "</div>" +
      '<div class="dealer-card__body">' +
      "<h3>" + CarsApp.escape(dealer.full_name) + "</h3>" +
      '<div class="dealer-card__meta"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"/></svg>' +
      "<span>" + CarsApp.escape(dealer.address) + "<br />" +
      CarsApp.escape(dealer.city) + ", " + CarsApp.escape(dealer.st || dealer.state) + " " + CarsApp.escape(dealer.zip) + "</span></div>" +
      "</div>" +
      '<div class="dealer-card__actions">' +
      '<a class="btn btn--primary btn--sm" href="/dealer/' + dealer.id + '/">View Dealer</a>' +
      reviewAction +
      "</div>" +
      "</article>"
    );
  }

  function render(dealers, session, state) {
    if (!dealers.length) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1">' +
        "<h3>No dealerships found</h3>" +
        "<p>There are no Cars Dealership branches in " + CarsApp.escape(state || "this area") +
        '. <a href="/">Show all dealerships</a>.</p></div>';
    } else {
      grid.innerHTML = dealers.map(function (dealer) {
        return dealerCard(dealer, session);
      }).join("");
    }

    if (countEl) {
      countEl.innerHTML =
        "Showing <strong>" + dealers.length + "</strong> dealership" +
        (dealers.length === 1 ? "" : "s") +
        (state ? " in <strong>" + CarsApp.escape(state) + "</strong>" : " nationwide");
    }
  }

  async function load() {
    const state = currentState();
    const session = await CarsApp.renderAuthNav();

    grid.innerHTML = '<div class="loading-wrap" style="grid-column:1/-1"><div class="spinner"></div>Loading dealerships...</div>';

    if (stateSelect) stateSelect.value = state;
    chipRow.forEach(function (chip) {
      const value = chip.getAttribute("data-state-chip");
      chip.classList.toggle("is-active", (value || "").toLowerCase() === state.toLowerCase());
    });

    try {
      const url = state ? "/djangoapp/get_dealers/" + encodeURIComponent(state) : "/djangoapp/get_dealers";
      const data = await CarsApp.api(url);
      render(data.dealers || [], session || { authenticated: false }, state);
    } catch (error) {
      grid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1"><h3>Unable to load dealerships</h3><p>' +
        CarsApp.escape(error.message) + "</p></div>";
    }
  }

  if (filterForm) {
    filterForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const value = stateSelect ? stateSelect.value : "";
      window.location.href = value ? "/?state=" + encodeURIComponent(value) : "/";
    });
  }

  load();
})();
