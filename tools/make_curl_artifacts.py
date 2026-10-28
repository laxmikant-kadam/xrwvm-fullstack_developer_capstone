"""Generate the cURL based submission artefacts.

Every file in ``submission/`` produced here contains the exact command that was
executed and the exact output that the command printed, e.g.::

    $ curl -s "http://127.0.0.1:8000/djangoapp/get_dealers" | python -m json.tool
    { ... }

Usage (with the Django server running on http://127.0.0.1:8000):

    python tools/make_curl_artifacts.py
"""
import json
import subprocess
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
ROOT = Path(__file__).resolve().parent.parent
SUBMISSION = ROOT / "submission"
SUBMISSION.mkdir(exist_ok=True)

COOKIE_JAR = "cookies.txt"


def run(args):
    """Run curl and return its stdout as text."""
    completed = subprocess.run(args, capture_output=True, text=True)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr or f"curl failed: {args}")
    return completed.stdout


def pretty(raw):
    try:
        return json.dumps(json.loads(raw), indent=4)
    except json.JSONDecodeError:
        return raw


def write(name, command, output):
    (SUBMISSION / name).write_text(f"$ {command}\n\n{output}\n", encoding="utf-8")
    print(f"wrote submission/{name}")


def get_artefact(name, url, display_url=None):
    raw = run(["curl", "-s", url])
    display_url = display_url or url
    write(name, f'curl -s "{display_url}" | python -m json.tool', pretty(raw))


def main():
    # ---------------------------------------------------------------- dealers
    get_artefact("getalldealers", f"{BASE_URL}/djangoapp/get_dealers")
    get_artefact(
        "getdealersbyState",
        f"{BASE_URL}/djangoapp/get_dealers/Kansas",
        f"{BASE_URL}/djangoapp/get_dealers/Kansas",
    )
    get_artefact("getdealerbyid", f"{BASE_URL}/djangoapp/get_dealer/1")
    get_artefact(
        "getdealerreviews",
        f"{BASE_URL}/djangoapp/get_dealer_reviews?dealerId=1",
        f"{BASE_URL}/djangoapp/get_dealer_reviews?dealerId=1",
    )

    # ------------------------------------------------------------ car makes
    get_artefact("getallcarmakes", f"{BASE_URL}/djangoapp/get_cars")

    # -------------------------------------------------------- sentiment API
    get_artefact(
        "analyzereview",
        f"{BASE_URL}/djangoapp/analyze/Fantastic%20services",
        f"{BASE_URL}/djangoapp/analyze/Fantastic%20services",
    )

    # ---------------------------------------------------------------- login
    payload = {"userName": "carsuser", "password": "Cars@2026"}
    login_cmd = (
        f'curl -s -i -c {COOKIE_JAR} -X POST "{BASE_URL}/djangoapp/login" '
        f'-H "Content-Type: application/json" '
        f"-d '{json.dumps(payload)}'"
    )
    login_out = run([
        "curl", "-s", "-i", "-c", COOKIE_JAR, "-X", "POST",
        f"{BASE_URL}/djangoapp/login",
        "-H", "Content-Type: application/json",
        "-d", json.dumps(payload),
    ])
    write("loginuser", login_cmd, login_out)

    # --------------------------------------------------------------- logout
    logout_cmd = f'curl -s -i -b {COOKIE_JAR} "{BASE_URL}/djangoapp/logout"'
    logout_out = run(["curl", "-s", "-i", "-b", COOKIE_JAR, f"{BASE_URL}/djangoapp/logout"])
    write("logoutuser", logout_cmd, logout_out)


if __name__ == "__main__":
    main()
