"""Load the dealership, car and review seed data into the database.

    python manage.py seed_db            # idempotent, keeps existing rows
    python manage.py seed_db --flush    # wipe dealership data first
"""
import json
from datetime import date, datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from djangoapp.models import CarMake, CarModel, Dealer, Review

DATA_DIR = Path(settings.BASE_DIR) / "server" / "database" / "data"

STATE_ABBR = {
    "Kansas": "KS", "California": "CA", "Texas": "TX", "New York": "NY",
    "Florida": "FL", "Illinois": "IL", "Ohio": "OH", "Arizona": "AZ",
    "Georgia": "GA", "Colorado": "CO", "Washington": "WA", "Michigan": "MI",
}


def load(name):
    with open(DATA_DIR / name, encoding="utf-8") as handle:
        return json.load(handle)


class Command(BaseCommand):
    help = "Seed the database with dealerships, car makes/models and reviews"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete existing dealers, car makes and reviews before loading",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            Review.objects.all().delete()
            CarModel.objects.all().delete()
            CarMake.objects.all().delete()
            Dealer.objects.all().delete()
            self.stdout.write(self.style.WARNING("Existing dealership data removed"))

        # ---------------- dealers ---------------- #
        dealer_count = 0
        for item in load("dealerships.json"):
            state = item["state"]
            Dealer.objects.update_or_create(
                pk=item["id"],
                defaults={
                    "full_name": item["full_name"],
                    "short_name": item["short_name"],
                    "address": item["address"],
                    "city": item["city"],
                    "state": state,
                    "zip_code": item["zip"],
                    "latitude": item["lat"],
                    "longitude": item["long"],
                },
            )
            dealer_count += 1

        # ---------------- car makes / models ---------------- #
        make_count = 0
        model_count = 0
        for item in load("car_models.json"):
            make, _ = CarMake.objects.update_or_create(
                pk=item["id"],
                defaults={
                    "name": item["name"],
                    "description": item.get("description", ""),
                    "country": item.get("country", ""),
                },
            )
            make_count += 1
            for model in item.get("models", []):
                CarModel.objects.update_or_create(
                    car_make=make,
                    name=model["name"],
                    year=model.get("year", 2023),
                    defaults={"type": model.get("type", "SEDAN")},
                )
                model_count += 1

        # ---------------- reviews ---------------- #
        review_count = 0
        for item in load("reviews.json"):
            dealer = Dealer.objects.get(pk=item["dealer_id"])
            purchase_date = item.get("purchase_date") or None
            if purchase_date:
                purchase_date = date.fromisoformat(purchase_date)
            review, _ = Review.objects.update_or_create(
                dealer=dealer,
                name=item["name"],
                review=item["review"],
                defaults={
                    "dealership": item.get("dealership", dealer.full_name),
                    "purchase": item.get("purchase", False),
                    "purchase_date": purchase_date,
                    "car_make": item.get("car_make", ""),
                    "car_model": item.get("car_model", ""),
                    "car_year": item.get("car_year"),
                    "sentiment": item.get("sentiment", "neutral"),
                },
            )
            # created_at is auto_now_add, so it can only be back-dated with an
            # UPDATE statement - this keeps the seed reviews looking realistic.
            created_at = item.get("created_at")
            if created_at:
                Review.objects.filter(pk=review.pk).update(
                    created_at=datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                )
            review_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {dealer_count} dealers, {make_count} car makes, "
                f"{model_count} models and {review_count} reviews."
            )
        )
