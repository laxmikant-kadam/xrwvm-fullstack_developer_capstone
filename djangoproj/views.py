"""Page views - they render the Django served pages of the Cars Dealership site."""
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from django.urls import reverse

from djangoapp.models import Dealer


def _carousel_dealers(limit=6):
    """Dealers used by the landing page carousel (rendered client side too)."""
    return Dealer.objects.all()[:limit]


def home(request):
    """Landing page - lists every dealership branch."""
    return render(request, "index.html")


def dealers_page(request):
    """Same landing page, used when a state filter is applied."""
    return render(request, "index.html")


def about(request):
    return render(request, "About.html")


def contact(request):
    return render(request, "Contact.html")


def dealer_view(request, dealer_id):
    return render(request, "Dealer.html", {"dealer_id": dealer_id})


def login_view(request):
    next_url = request.POST.get("next") or request.GET.get("next") or reverse("home")
    if request.user.is_authenticated:
        return redirect(next_url)

    if request.method == "POST":
        user_name = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""
        user = authenticate(request, username=user_name, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {user.get_username()}!")
            return redirect(next_url)
        messages.error(request, "Invalid username or password. Please try again.")

    return render(request, "Login.html", {"next": next_url})


def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out successfully.")
    return redirect(reverse("home"))


def register_view(request):
    if request.method == "POST":
        user_name = (request.POST.get("username") or "").strip()
        first_name = (request.POST.get("first_name") or "").strip()
        last_name = (request.POST.get("last_name") or "").strip()
        email = (request.POST.get("email") or "").strip()
        password = request.POST.get("password") or ""
        confirm = request.POST.get("confirm_password") or ""

        if not user_name or not password:
            messages.error(request, "Username and password are required.")
        elif password != confirm:
            messages.error(request, "The two password fields do not match.")
        elif User.objects.filter(username=user_name).exists():
            messages.error(request, f"The username '{user_name}' is already taken.")
        else:
            user = User.objects.create_user(
                username=user_name,
                password=password,
                first_name=first_name,
                last_name=last_name,
                email=email,
            )
            login(request, user)
            messages.success(request, f"Account created - welcome, {user.username}!")
            return redirect(reverse("home"))

    return render(request, "Register.html")
