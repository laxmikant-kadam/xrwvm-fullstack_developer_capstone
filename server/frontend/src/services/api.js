import axios from "axios";

const api = axios.create({
  baseURL: "/djangoapp",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function csrfToken() {
  const match = document.cookie.match(/(^|;)\s*csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : "";
}

export const getDealers = async (state) => {
  const url = state ? `/get_dealers/${encodeURIComponent(state)}` : "/get_dealers";
  const { data } = await api.get(url);
  return data.dealers || [];
};

export const getDealer = async (id) => {
  const { data } = await api.get(`/get_dealer/${id}`);
  return data;
};

export const getDealerReviews = async (dealerId) => {
  const { data } = await api.get(`/get_dealer_reviews?dealerId=${dealerId}`);
  return data.reviews || [];
};

export const getCars = async () => {
  const { data } = await api.get("/get_cars");
  return data.car_makes || [];
};

export const analyzeReview = async (text) => {
  const { data } = await api.get(`/analyze/${encodeURIComponent(text)}`);
  return data;
};

export const getSession = async () => {
  const { data } = await api.get("/session");
  return data;
};

export const loginUser = async (userName, password) => {
  const { data } = await api.post(
    "/login",
    { userName, password },
    { headers: { "X-CSRFToken": csrfToken() } }
  );
  return data;
};

export const logoutUser = async () => {
  const { data } = await api.get("/logout");
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await api.post("/register", payload, {
    headers: { "X-CSRFToken": csrfToken() },
  });
  return data;
};

export const addReview = async (payload) => {
  const { data } = await api.post("/add_review", payload, {
    headers: { "X-CSRFToken": csrfToken() },
  });
  return data;
};

export default api;
