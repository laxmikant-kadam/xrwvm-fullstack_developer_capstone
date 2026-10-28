"""URL routes of the djangoapp (mounted at /djangoapp/)."""
from django.urls import path

from . import restapis, views

urlpatterns = [
    # authentication
    path("login", views.login_user, name="login_user"),
    path("logout", views.logout_user, name="logout_user"),
    path("register", views.register_user, name="register_user"),
    # dealers
    path("get_dealers", restapis.get_dealers, name="get_dealers"),
    path("get_dealers/<str:state>", restapis.get_dealers, name="get_dealers_by_state"),
    path("get_dealer/<int:dealer_id>", restapis.get_dealer_details, name="get_dealer"),
    path("get_dealer_reviews", restapis.get_dealer_reviews, name="get_dealer_reviews"),
    # legacy aliases kept for the React frontend
    path("fetchDealers", restapis.get_dealers, name="fetch_dealers"),
    path("fetchDealers/<str:state>", restapis.get_dealers, name="fetch_dealers_state"),
    path("fetchDealer/<int:dealer_id>", restapis.get_dealer_details, name="fetch_dealer"),
    path(
        "fetchReviews/dealer/<int:dealer_id>",
        restapis.get_dealer_reviews,
        name="fetch_reviews_legacy",
    ),
    # car makes and models
    path("get_cars", restapis.get_cars, name="get_cars"),
    path("fetchcars", restapis.get_cars, name="fetch_cars"),
    # reviews
    path("add_review", restapis.add_review, name="add_review"),
    path("get_all_reviews", restapis.get_all_reviews, name="get_all_reviews"),
    # sentiment analysis
    path("analyze/<str:text>", restapis.analyze_review, name="analyze_review"),
    # session helper used by the landing page
    path("session", restapis.session_info, name="session_info"),
    path("health", restapis.health, name="health"),
]
