"""Django admin configuration for the Cars Dealership application."""
from django.contrib import admin

from .models import CarMake, CarModel, Dealer, Review


class CarModelInline(admin.TabularInline):
    model = CarModel
    extra = 1


@admin.register(CarMake)
class CarMakeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "country", "description")
    search_fields = ("name", "country")
    inlines = [CarModelInline]


@admin.register(CarModel)
class CarModelAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "car_make", "type", "year")
    list_filter = ("car_make", "type", "year")
    search_fields = ("name", "car_make__name")


@admin.register(Dealer)
class DealerAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "city",
        "state",
        "zip_code",
        "address",
    )
    list_filter = ("state",)
    search_fields = ("full_name", "city", "state", "zip_code")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "dealer",
        "name",
        "purchase",
        "sentiment",
        "car_make",
        "car_model",
        "car_year",
        "created_at",
    )
    list_filter = ("sentiment", "purchase", "dealer")
    search_fields = ("name", "review", "dealer__full_name")
