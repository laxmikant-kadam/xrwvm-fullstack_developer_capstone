"""Authentication endpoints used by the React frontend and the cURL tests."""
import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


def _payload(request):
    if request.content_type and "application/json" in request.content_type:
        try:
            return json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return {}
    if request.POST:
        return request.POST.dict()
    return {}


@csrf_exempt
def login_user(request):
    """POST /djangoapp/login  {"userName": "...", "password": "..."}"""
    if request.method != "POST":
        return JsonResponse({"status": 405, "message": "POST required"}, status=405)

    data = _payload(request)
    user_name = (data.get("userName") or data.get("username") or "").strip()
    password = data.get("password") or ""

    user = authenticate(request, username=user_name, password=password)
    if user is None:
        return JsonResponse(
            {"userName": user_name, "status": "Failed", "message": "Invalid credentials"},
            status=401,
        )

    login(request, user)
    return JsonResponse(
        {
            "userName": user.get_username(),
            "firstName": user.first_name,
            "lastName": user.last_name,
            "email": user.email,
            "status": "Authenticated",
        }
    )


def logout_user(request):
    """GET /djangoapp/logout - ends the session created by /djangoapp/login."""
    user_name = request.user.get_username() if request.user.is_authenticated else ""
    logout(request)
    return JsonResponse({"userName": user_name, "status": "Logged out"})


@csrf_exempt
def register_user(request):
    """POST /djangoapp/register - creates a customer account."""
    if request.method != "POST":
        return JsonResponse({"status": 405, "message": "POST required"}, status=405)

    data = _payload(request)
    user_name = (data.get("userName") or data.get("username") or "").strip()
    first_name = (data.get("firstName") or "").strip()
    last_name = (data.get("lastName") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not user_name or not password:
        return JsonResponse(
            {"status": "Failed", "message": "userName and password are required"},
            status=400,
        )

    if User.objects.filter(username=user_name).exists():
        return JsonResponse(
            {"userName": user_name, "status": "Failed",
             "message": "User already exists"},
            status=409,
        )

    user = User.objects.create_user(
        username=user_name,
        password=password,
        first_name=first_name,
        last_name=last_name,
        email=email,
    )
    return JsonResponse(
        {
            "userName": user.get_username(),
            "firstName": user.first_name,
            "lastName": user.last_name,
            "email": user.email,
            "status": "Authenticated",
        },
        status=201,
    )
