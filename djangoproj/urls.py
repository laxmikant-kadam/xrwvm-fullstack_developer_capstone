"""Root URL configuration for the Cars Dealership project."""
from django.contrib import admin
from django.urls import include, path

from djangoproj import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.home, name="home"),
    path("about/", views.about, name="about"),
    path("contact/", views.contact, name="contact"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register_view, name="register"),
    path("dealer/<int:dealer_id>/", views.dealer_view, name="dealer"),
    path("dealers/", views.dealers_page, name="dealers"),
    path("djangoapp/", include("djangoapp.urls")),
]
