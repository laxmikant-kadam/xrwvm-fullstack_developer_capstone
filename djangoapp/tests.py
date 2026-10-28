"""Tests for the Cars Dealership REST API and page views.

Run with:
    python manage.py test
"""
import json
from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase

from .models import CarMake, CarModel, Dealer, Review


class BaseDealerTestCase(TestCase):
    def setUp(self):
        self.toyota = CarMake.objects.create(
            name="Toyota", country="Japan", description="Reliable cars"
        )
        CarModel.objects.create(
            car_make=self.toyota, name="Camry", type="SEDAN", year=2024
        )
        CarModel.objects.create(
            car_make=self.toyota, name="RAV4", type="SUV", year=2024
        )

        self.kansas = Dealer.objects.create(
            full_name="Cars Dealership - Wichita",
            short_name="Wichita",
            address="5150 N Webb Road",
            city="Wichita",
            state="Kansas",
            zip_code="67208",
            latitude=37.7234,
            longitude=-97.2425,
        )
        self.texas = Dealer.objects.create(
            full_name="Cars Dealership - Austin",
            short_name="Austin",
            address="8900 Research Boulevard",
            city="Austin",
            state="Texas",
            zip_code="78758",
            latitude=30.3735,
            longitude=-97.7188,
        )
        self.review = Review.objects.create(
            dealer=self.kansas,
            name="Priya Nair",
            dealership=self.kansas.full_name,
            review="Fantastic services, the team was very helpful.",
            purchase=True,
            purchase_date=date(2024, 11, 16),
            car_make="Toyota",
            car_model="RAV4",
            car_year=2022,
            sentiment="positive",
        )


class DealerApiTests(BaseDealerTestCase):
    def test_get_all_dealers(self):
        response = self.client.get("/djangoapp/get_dealers")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], 200)
        self.assertEqual(len(payload["dealers"]), 2)
        states = {dealer["state"] for dealer in payload["dealers"]}
        self.assertEqual(states, {"Kansas", "Texas"})
        self.assertEqual(payload["dealers"][0]["st"], "TX")

    def test_get_dealers_by_state(self):
        response = self.client.get("/djangoapp/get_dealers/Kansas")
        self.assertEqual(response.status_code, 200)
        dealers = response.json()["dealers"]
        self.assertEqual(len(dealers), 1)
        self.assertEqual(dealers[0]["short_name"], "Wichita")

    def test_get_dealer_details(self):
        response = self.client.get(f"/djangoapp/get_dealer/{self.kansas.id}")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["dealer"]["id"], self.kansas.id)
        self.assertEqual(len(payload["reviews"]), 1)

    def test_get_dealer_details_not_found(self):
        response = self.client.get("/djangoapp/get_dealer/9999")
        self.assertEqual(response.status_code, 404)

    def test_get_dealer_reviews(self):
        response = self.client.get(
            f"/djangoapp/get_dealer_reviews?dealerId={self.kansas.id}"
        )
        self.assertEqual(response.status_code, 200)
        reviews = response.json()["reviews"]
        self.assertEqual(len(reviews), 1)
        self.assertEqual(reviews[0]["sentiment"], "positive")

    def test_get_dealer_reviews_requires_dealer_id(self):
        response = self.client.get("/djangoapp/get_dealer_reviews")
        self.assertEqual(response.status_code, 400)

    def test_get_cars(self):
        response = self.client.get("/djangoapp/get_cars")
        self.assertEqual(response.status_code, 200)
        makes = response.json()["car_makes"]
        self.assertEqual(makes[0]["name"], "Toyota")
        self.assertEqual(len(makes[0]["models"]), 2)

    def test_analyze_review(self):
        response = self.client.get("/djangoapp/analyze/Fantastic%20services")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["sentiment"], "positive")

    def test_analyze_negative_review(self):
        response = self.client.get("/djangoapp/analyze/Terrible%20and%20rude%20staff")
        self.assertEqual(response.json()["sentiment"], "negative")


class AuthenticationTests(BaseDealerTestCase):
    def test_register_login_logout_cycle(self):
        response = self.client.post(
            "/djangoapp/register",
            data=json.dumps(
                {
                    "userName": "testuser",
                    "firstName": "Test",
                    "lastName": "User",
                    "email": "test@example.com",
                    "password": "Test@12345",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["status"], "Authenticated")

        response = self.client.post(
            "/djangoapp/login",
            data=json.dumps({"userName": "testuser", "password": "Test@12345"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "Authenticated")

        response = self.client.get("/djangoapp/session")
        self.assertTrue(response.json()["authenticated"])

        response = self.client.get("/djangoapp/logout")
        self.assertEqual(response.json()["status"], "Logged out")
        self.assertFalse(self.client.get("/djangoapp/session").json()["authenticated"])

    def test_login_invalid_credentials(self):
        User.objects.create_user(username="someone", password="Secret@123")
        response = self.client.post(
            "/djangoapp/login",
            data=json.dumps({"userName": "someone", "password": "wrong"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["status"], "Failed")

    def test_add_review_requires_login_and_fields(self):
        response = self.client.post(
            "/djangoapp/add_review",
            data=json.dumps({"dealership": self.kansas.id, "name": "", "review": ""}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)


class PageTests(BaseDealerTestCase):
    def test_home_page(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cars Dealership")

    def test_about_page(self):
        response = self.client.get("/about/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "About Us")

    def test_contact_page(self):
        response = self.client.get("/contact/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Contact Us")
        self.assertContains(response, "support@carsdealership.com")

    def test_login_page(self):
        self.assertEqual(self.client.get("/login/").status_code, 200)

    def test_register_page(self):
        self.assertEqual(self.client.get("/register/").status_code, 200)
