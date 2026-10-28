"""Unit tests for the sentiment analyser micro-service."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sentiment_analyzer.analyzer import analyze, compound_score  # noqa: E402


class AnalyzerTests(unittest.TestCase):
    def test_positive(self):
        result = analyze("Fantastic services")
        self.assertEqual(result["sentiment"], "positive")
        self.assertGreater(result["score"], 0.05)

    def test_negative(self):
        result = analyze("Terrible service, the staff was rude and dishonest")
        self.assertEqual(result["sentiment"], "negative")
        self.assertLess(result["score"], -0.05)

    def test_neutral(self):
        result = analyze("I visited the dealership on Monday")
        self.assertEqual(result["sentiment"], "neutral")

    def test_negation(self):
        self.assertLess(compound_score("not good"), 0)

    def test_empty(self):
        self.assertEqual(analyze("")["sentiment"], "neutral")


if __name__ == "__main__":
    unittest.main()
