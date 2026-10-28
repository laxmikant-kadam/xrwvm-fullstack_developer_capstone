"""REST API used by the React frontend and by the cURL based test cases."""
from datetime import date

import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import CarMake, Dealer, Review


# --------------------------------------------------------------------------- #
# Serialisers
# --------------------------------------------------------------------------- #
STATE_ABBR = {
    "Kansas": "KS", "California": "CA", "Texas": "TX", "New York": "NY",
    "Florida": "FL", "Illinois": "IL", "Ohio": "OH", "Arizona": "AZ",
    "Georgia": "GA", "Colorado": "CO", "Washington": "WA", "Michigan": "MI",
}
ABBR_STATE = {value: key for key, value in STATE_ABBR.items()}


def serialize_dealer(dealer: Dealer) -> dict:
    abbreviation = STATE_ABBR.get(dealer.state, dealer.state)
    return {
        "id": dealer.id,
        "full_name": dealer.full_name,
        "short_name": dealer.short_name,
        "address": dealer.address,
        "city": dealer.city,
        "state": dealer.state,
        "st": abbreviation,
        "zip": dealer.zip_code,
        "st_zip": f"{abbreviation} {dealer.zip_code}",
        "lat": dealer.latitude,
        "long": dealer.longitude,
        "latitude": dealer.latitude,
        "longitude": dealer.longitude,
    }


def serialize_review(review: Review) -> dict:
    return {
        "id": review.id,
        "name": review.name,
        "dealership": review.dealer_id,
        "review": review.review,
        "purchase": review.purchase,
        "purchase_date": review.purchase_date.isoformat()
        if review.purchase_date
        else "",
        "car_make": review.car_make,
        "car_model": review.car_model,
        "car_year": review.car_year,
        "sentiment": review.sentiment,
        "created_at": review.created_at.isoformat(),
    }


# --------------------------------------------------------------------------- #
# Sentiment analysis
# --------------------------------------------------------------------------- #
def get_sentiment(text: str) -> str:
    """Call the Flask sentiment service, fall back to the local analyser."""
    try:
        response = requests.post(
            settings.SENTIMENT_ANALYZER_URL, json={"text": text}, timeout=5
        )
        if response.status_code == 200:
            return response.json().get("sentiment", "neutral")
    except Exception:
        pass

    try:
        import sys

        from django.conf import settings as dj_settings

        analyzer_path = str(dj_settings.BASE_DIR / "sentiment_analyzer")
        if analyzer_path not in sys.path:
            sys.path.insert(0, analyzer_path)
        from analyzer import analyze  # type: ignore

        return analyze(text).get("sentiment", "neutral")
    except Exception:
        return "neutral"


# --------------------------------------------------------------------------- #
# Dealers
# --------------------------------------------------------------------------- #
@api_view(["GET"])
def get_dealers(request, state=None):
    """All dealers, or the dealers of one state: /get_dealers/ or /get_dealers/Kansas"""
    if state is None:
        state = request.GET.get("state") or request.GET.get("st")

    dealers = Dealer.objects.all()
    if state:
        cleaned = state.replace("-", " ").replace("_", " ").strip()
        # accept both the full state name ("Kansas") and the two letter code ("KS")
        cleaned = ABBR_STATE.get(cleaned.upper(), cleaned)
        dealers = dealers.filter(state__iexact=cleaned)

    return Response({"status": 200, "dealers": [serialize_dealer(d) for d in dealers]})


@api_view(["GET"])
def get_dealer_details(request, dealer_id):
    """Details of one dealer including its reviews: /get_dealer/1"""
    try:
        dealer = Dealer.objects.get(pk=dealer_id)
    except Dealer.DoesNotExist:
        return Response(
            {"status": 404, "message": f"Dealer {dealer_id} not found"}, status=404
        )

    return Response(
        {
            "status": 200,
            "dealer": serialize_dealer(dealer),
            "reviews": [
                serialize_review(r) for r in dealer.reviews.all().order_by("-created_at")
            ],
        }
    )


@api_view(["GET"])
def get_dealer_reviews(request):
    """Reviews of a dealer: /get_dealer_reviews?dealerId=1"""
    dealer_id = request.GET.get("dealerId") or request.GET.get("dealer_id")
    if not dealer_id:
        return Response(
            {"status": 400, "message": "dealerId query parameter is required"},
            status=400,
        )

    reviews = Review.objects.filter(dealer_id=dealer_id).order_by("-created_at")
    return Response(
        {
            "status": 200,
            "dealerId": int(dealer_id),
            "reviews": [serialize_review(r) for r in reviews],
        }
    )


# --------------------------------------------------------------------------- #
# Car makes / models
# --------------------------------------------------------------------------- #
@api_view(["GET"])
def get_cars(request):
    """Every car make with the models that belong to it."""
    makes = []
    for make in CarMake.objects.prefetch_related("models").all():
        makes.append(
            {
                "id": make.id,
                "name": make.name,
                "description": make.description,
                "models": [
                    {
                        "id": model.id,
                        "name": model.name,
                        "type": model.type,
                        "year": model.year,
                    }
                    for model in make.models.all()
                ],
            }
        )
    return Response({"status": 200, "car_makes": makes})


# --------------------------------------------------------------------------- #
# Sentiment analysis endpoint
# --------------------------------------------------------------------------- #
@api_view(["GET"])
def analyze_review(request, text):
    """Sentiment of a piece of text: /analyze/Fantastic%20services"""
    sentiment = get_sentiment(text)
    return Response({"status": 200, "text": text, "sentiment": sentiment})


# --------------------------------------------------------------------------- #
# Reviews - create
# --------------------------------------------------------------------------- #
@csrf_exempt
@api_view(["POST"])
def add_review(request):
    """Create a review, run sentiment analysis and store the result."""
    data = request.data if hasattr(request, "data") else {}

    dealer_id = data.get("dealership") or data.get("dealerId") or data.get("dealer")
    name = (data.get("name") or data.get("userName") or "").strip()
    review_text = (data.get("review") or "").strip()

    if not dealer_id or not name or not review_text:
        return Response(
            {"status": 400, "message": "dealership, name and review are required"},
            status=400,
        )

    try:
        dealer = Dealer.objects.get(pk=dealer_id)
    except Dealer.DoesNotExist:
        return Response({"status": 404, "message": "Dealer not found"}, status=404)

    purchase_date = data.get("purchase_date") or data.get("purchaseDate") or None
    if purchase_date in ("", None):
        purchase_date = None
    elif isinstance(purchase_date, str):
        try:
            purchase_date = date.fromisoformat(purchase_date[:10])
        except ValueError:
            purchase_date = None

    purchase = data.get("purchase")
    if isinstance(purchase, str):
        purchase = purchase.lower() in ("true", "1", "yes", "on")

    sentiment = get_sentiment(review_text)

    review = Review.objects.create(
        dealer=dealer,
        name=name,
        dealership=dealer.full_name,
        review=review_text,
        purchase=bool(purchase),
        purchase_date=purchase_date,
        car_make=data.get("car_make") or data.get("carMake") or "",
        car_model=data.get("car_model") or data.get("carModel") or "",
        car_year=data.get("car_year") or data.get("carYear") or None,
        sentiment=sentiment,
    )

    return Response({"status": 200, "review": serialize_review(review)})


@api_view(["GET"])
def get_all_reviews(request):
    """Every review in the database (used by the admin dashboard)."""
    reviews = Review.objects.all().order_by("-created_at")[:100]
    return Response(
        {"status": 200, "reviews": [serialize_review(r) for r in reviews]}
    )


@api_view(["GET"])
def session_info(request):
    """Who is logged in? Used by the landing page to swap Login/Logout links."""
    user = request.user
    if user.is_authenticated:
        return Response(
            {
                "status": 200,
                "authenticated": True,
                "userName": user.get_username(),
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email,
            }
        )
    return Response({"status": 200, "authenticated": False, "userName": ""})


def health(request):
    return JsonResponse({"status": "ok", "service": "djangoapp"})
