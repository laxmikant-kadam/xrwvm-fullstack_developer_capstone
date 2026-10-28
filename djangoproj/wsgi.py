"""WSGI config for the Cars Dealership project."""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "djangoproj.settings")

application = get_wsgi_application()
