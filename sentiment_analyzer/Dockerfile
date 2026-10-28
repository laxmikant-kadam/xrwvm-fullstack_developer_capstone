# ---- Cars Dealership - sentiment analysis micro-service ------------------------
# Build:  docker build -t cars-dealership-sentiment ./sentiment_analyzer
# Run:    docker run -p 5050:5050 cars-dealership-sentiment
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5050

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5050

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5050", "--workers", "2", "--timeout", "60"]
