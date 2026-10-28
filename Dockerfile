# ---- Cars Dealership - Django application -------------------------------------
# Build:  docker build -t cars-dealership .
# Run:    docker run -p 8000:8000 cars-dealership
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_DEBUG=False \
    DJANGO_SECRET_KEY=change-me-in-production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Seed the database and start the WSGI server (WhiteNoise serves the static files)
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_db && gunicorn djangoproj.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120"]
