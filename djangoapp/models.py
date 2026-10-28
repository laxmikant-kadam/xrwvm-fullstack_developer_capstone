"""Database models for the Cars Dealership application.

The capstone reference implementation stores car makes/models, dealers and
reviews in MongoDB. This implementation keeps the same JSON contract but stores
the data in the relational database so that the application can run anywhere
(SQLite by default, PostgreSQL when DB_ENGINE=postgres).
"""
from django.db import models


class CarMake(models.Model):
    """A car manufacturer, e.g. Toyota."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    country = models.CharField(max_length=100, blank=True, default="")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class CarModel(models.Model):
    """A model produced by a car make, e.g. Toyota Camry."""

    SEDAN = "SEDAN"
    SUV = "SUV"
    WAGON = "WAGON"
    COUPE = "COUPE"
    TRUCK = "TRUCK"
    HATCHBACK = "HATCHBACK"
    TYPE_CHOICES = [
        (SEDAN, "Sedan"),
        (SUV, "SUV"),
        (WAGON, "Wagon"),
        (COUPE, "Coupe"),
        (TRUCK, "Truck"),
        (HATCHBACK, "Hatchback"),
    ]

    car_make = models.ForeignKey(
        CarMake, on_delete=models.CASCADE, related_name="models"
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=SEDAN)
    year = models.IntegerField(default=2023)

    class Meta:
        ordering = ["car_make__name", "name"]
        unique_together = ("car_make", "name", "year")

    def __str__(self):
        return f"{self.car_make.name} {self.name} ({self.year})"


class Dealer(models.Model):
    """A Cars Dealership branch."""

    full_name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=50, db_index=True)
    zip_code = models.CharField(max_length=20)
    latitude = models.FloatField(default=0.0)
    longitude = models.FloatField(default=0.0)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} - {self.city}, {self.state}"


class Review(models.Model):
    """A customer review posted for a dealer."""

    dealer = models.ForeignKey(
        Dealer, on_delete=models.CASCADE, related_name="reviews"
    )
    name = models.CharField(max_length=100)
    dealership = models.CharField(max_length=200, blank=True, default="")
    review = models.TextField()
    purchase = models.BooleanField(default=False)
    purchase_date = models.DateField(null=True, blank=True)
    car_make = models.CharField(max_length=100, blank=True, default="")
    car_model = models.CharField(max_length=100, blank=True, default="")
    car_year = models.IntegerField(null=True, blank=True)
    sentiment = models.CharField(max_length=20, blank=True, default="neutral")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Review by {self.name} - {self.dealer.short_name}"
