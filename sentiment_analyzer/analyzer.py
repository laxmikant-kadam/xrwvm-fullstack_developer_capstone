"""Lightweight lexicon based sentiment analyser.

The capstone uses a Flask micro-service to score the sentiment of a customer
review.  The service is intentionally dependency free so that it can be built
into a very small container and started inside Kubernetes / Code Engine in a
couple of seconds.

If the optional ``nltk`` VADER lexicon is available it is used, otherwise the
built-in lexicon below produces the same three way classification
(``positive`` / ``neutral`` / ``negative``).
"""
from __future__ import annotations

import re

POSITIVE_WORDS = {
    "amazing": 3.1, "awesome": 3.1, "best": 3.2, "brilliant": 2.8,
    "comfortable": 1.9, "courteous": 2.1, "delightful": 2.5, "excellent": 3.1,
    "exceptional": 3.4, "fantastic": 3.5, "friendly": 2.2, "generous": 2.0,
    "glad": 2.0, "good": 1.9, "great": 3.1, "happy": 2.7, "helpful": 2.4,
    "honest": 2.3, "impressed": 2.5, "incredible": 3.0, "love": 3.2,
    "lovely": 2.8, "outstanding": 3.3, "perfect": 3.0, "pleasant": 2.3,
    "professional": 2.1, "reasonable": 1.6, "recommend": 2.4, "reliable": 2.2,
    "satisfied": 2.4, "smooth": 1.8, "superb": 3.2, "thanks": 1.9,
    "thank": 1.9, "transparent": 1.8, "trustworthy": 2.4, "value": 1.6,
    "wonderful": 3.2, "worth": 1.7, "easy": 1.9, "fast": 1.4,
    "clean": 1.7, "fair": 1.6, "nice": 1.8, "solid": 1.6, "polite": 2.0,
    "responsive": 2.0, "accommodating": 2.1, "recommended": 2.4,
}

NEGATIVE_WORDS = {
    "angry": -2.8, "annoying": -2.3, "awful": -3.2, "bad": -2.4,
    "broken": -2.3, "confusing": -2.0, "costly": -1.9, "dirty": -2.2,
    "disappointed": -2.5, "disappointing": -2.5, "dishonest": -3.1,
    "expensive": -1.7, "fail": -2.6, "failed": -2.6, "fraud": -3.4,
    "hate": -3.0, "horrible": -3.3, "incompetent": -3.0, "late": -1.4,
    "lied": -3.0, "lies": -3.0, "mess": -2.0, "overpriced": -2.4,
    "poor": -2.4, "problem": -1.7, "problems": -1.7, "rude": -2.9,
    "scam": -3.4, "slow": -1.6, "terrible": -3.4, "unhelpful": -2.6,
    "unprofessional": -2.7, "unreliable": -2.5, "upset": -2.4,
    "useless": -2.8, "waste": -2.5, "worst": -3.4, "wrong": -1.9,
    "waiting": -1.3, "pushy": -2.1, "hidden": -1.5, "cheated": -3.1,
}

INTENSIFIERS = {
    "very": 0.3, "extremely": 0.45, "really": 0.25, "so": 0.2,
    "absolutely": 0.4, "totally": 0.35, "super": 0.3, "incredibly": 0.45,
}

NEGATIONS = {"not", "no", "never", "none", "cannot", "cant", "can't", "dont",
             "don't", "didnt", "didn't", "isnt", "isn't", "wasnt", "wasn't",
             "wouldnt", "wouldn't", "hardly", "barely", "without"}

WORD_RE = re.compile(r"[a-zA-Z']+")


def _score_vader(text: str):
    try:  # pragma: no cover - optional dependency
        from nltk.sentiment.vader import SentimentIntensityAnalyzer

        return SentimentIntensityAnalyzer().polarity_scores(text)["compound"]
    except Exception:
        return None


def compound_score(text: str) -> float:
    """Return a compound score in the range -1.0 .. 1.0."""
    text = (text or "").strip()
    if not text:
        return 0.0

    vader = _score_vader(text)
    if vader is not None:
        return round(vader, 4)

    words = WORD_RE.findall(text.lower())
    total = 0.0
    hits = 0
    for index, word in enumerate(words):
        value = POSITIVE_WORDS.get(word, NEGATIVE_WORDS.get(word, 0.0))
        if not value:
            continue
        modifier = 1.0
        for previous in words[max(0, index - 2): index]:
            if previous in NEGATIONS:
                modifier *= -1.0
            if previous in INTENSIFIERS:
                modifier *= 1.0 + INTENSIFIERS[previous]
        total += value * modifier
        hits += 1

    if not hits:
        return 0.0

    # Normalise the same way VADER does (alpha = 15) so long reviews do not
    # saturate the scale.
    normalised = total / ((total ** 2 + 15) ** 0.5)
    return round(normalised, 4)


def analyze(text: str) -> dict:
    """Classify ``text`` and return the sentiment payload used by the API."""
    score = compound_score(text)
    if score >= 0.05:
        sentiment = "positive"
    elif score <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    return {"sentiment": sentiment, "score": score, "text": (text or "").strip()}
