"""Flask micro-service that scores the sentiment of a dealership review.

Run locally:
    python sentiment_analyzer/app.py          # http://localhost:5050/analyze

POST /analyze   {"text": "Fantastic services"}
                -> {"sentiment": "positive", "score": 0.6, "text": "..."}
GET  /analyze/<text>
GET  /health
"""
import os
import sys

from flask import Flask, jsonify, request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from analyzer import analyze  # noqa: E402

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "sentiment-analyzer"})


@app.post("/analyze")
def analyze_post():
    payload = request.get_json(silent=True) or {}
    text = payload.get("text") or payload.get("review") or request.form.get("text", "")
    if not str(text).strip():
        return jsonify({"error": "text is required"}), 400
    result = analyze(str(text))
    result["status"] = 200
    return jsonify(result)


@app.get("/analyze/<path:text>")
def analyze_get(text):
    result = analyze(text)
    result["status"] = 200
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=False)
