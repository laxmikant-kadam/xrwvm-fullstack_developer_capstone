# Capstone submission — Cars Dealership

Everything requested by the assignment is in this folder. Screenshots are
1920×1080 PNG captures of a real (non-headless) Chrome window, so the browser
address bar with the endpoint URL is part of every image.

* Project repository: <https://github.com/laxmikant-kadam/cars-dealership-capstone>
* Live application: <https://inventory-evident-special-voluntary.trycloudflare.com/>
  (see `deploymentURL` — read the caveat at the bottom of this file)

---

## 1. Deliverables by task

| # | Deliverable | File / URL | Notes |
|---|---|---|---|
| 1 | Project repository (README) | <https://github.com/laxmikant-kadam/cars-dealership-capstone> · <https://github.com/laxmikant-kadam/cars-dealership-capstone/blob/main/README.md> | Public repo, project name in the README |
| 2 | Django server output | [`django_server`](django_server) | Command line + startup banner + live request log |
| 3 | About Us page | <https://github.com/laxmikant-kadam/cars-dealership-capstone/blob/main/server/frontend/static/About.html> | Team name, roles, emails |
| 4 | Contact Us page | <https://github.com/laxmikant-kadam/cars-dealership-capstone/blob/main/server/frontend/static/Contact.html> | Address, phone, e-mail, opening hours |
| 5 | Login user (cURL) | [`loginuser`](loginuser) | `POST /djangoapp/login` → `{"status": "Authenticated"}` + session cookie |
| 6 | Logout user (cURL) | [`logoutuser`](logoutuser) | `GET /djangoapp/logout` → `{"userName": "carsuser", "status": "Logged out"}` |
| 7 | React sign-up page | <https://github.com/laxmikant-kadam/cars-dealership-capstone/blob/main/server/frontend/src/components/Register/Register.jsx> | Five fields + *Register* button |
| 8 | Get dealer reviews (cURL) | [`getdealerreviews`](getdealerreviews) | `GET /djangoapp/get_dealer_reviews/1` |
| 9 | Get all dealers (cURL) | [`getalldealers`](getalldealers) | `GET /djangoapp/get_dealers` — 12 dealers |
| 10 | Get dealer by id (cURL) | [`getdealerbyid`](getdealerbyid) | `GET /djangoapp/get_dealer/1` |
| 11 | Get dealers by state (cURL) | [`getdealersbyState`](getdealersbyState) | `GET /djangoapp/get_dealers/Kansas` — 3 dealers |
| 12 | Admin login screenshot | [`admin_login.png`](admin_login.png) | `http://127.0.0.1:8000/admin/` — “WELCOME, ROOT.” |
| 13 | Admin logout screenshot | [`admin_logout.png`](admin_logout.png) | `http://127.0.0.1:8000/admin/logout/` — “Logged out” |
| 14 | Get all car makes (cURL) | [`getallcarmakes`](getallcarmakes) | `GET /djangoapp/get_cars` — 12 makes / 50 models |
| 15 | (car models — included in the same payload) | [`getallcarmakes`](getallcarmakes) | Each make lists its models |
| 16 | Sentiment analysis (cURL) | [`analyzereview`](analyzereview) | `GET /djangoapp/analyze/Fantastic%20services` → `positive` |
| 17 | Dealers list (logged out) | [`get_dealers.png`](get_dealers.png) | `http://127.0.0.1:8000/` — Login / Sign Up visible |
| 18 | Dealers list (logged in) | [`get_dealers_loggedin.png`](get_dealers_loggedin.png) | “Signed in as carsuser” + *Review Dealer* button |
| 19 | Dealers filtered by state | [`dealersbystate.png`](dealersbystate.png) | `http://127.0.0.1:8000/?state=Kansas` — 3 Kansas dealers |
| 20 | Dealer detail + reviews | [`dealer_id_reviews.png`](dealer_id_reviews.png) | `http://127.0.0.1:8000/dealer/1/` — reviews + sentiment badges |
| 21 | Review submission form | [`dealership_review_submission.png`](dealership_review_submission.png) | Form filled in on `http://127.0.0.1:8000/dealer/1/` |
| 22 | Review added | [`added_review.png`](added_review.png) | Success banner, new review at the top with *Positive sentiment* |
| 23 | CI/CD output | [`CICD`](CICD) · <https://github.com/laxmikant-kadam/cars-dealership-capstone/actions> | GitHub Actions run: 4/4 jobs green |
| 24 | Deployment URL | [`deploymentURL`](deploymentURL) | Live public URL (see caveat) |
| 25 | Deployed landing page | [`deployed_landingpage.png`](deployed_landingpage.png) | Public URL in the address bar |
| 26 | Deployed — logged in | [`deployed_loggedin.png`](deployed_loggedin.png) | “Signed in as carsuser” over HTTPS |
| 27 | Deployed dealer detail | [`deployed_dealer_detail.png`](deployed_dealer_detail.png) | `/dealer/1/` on the public URL |
| 28 | Deployed review added | [`deployed_add_review.png`](deployed_add_review.png) | Review posted against the public URL |

---

## 2. cURL artefacts

Every file in this folder whose name starts with `get…`, `login…`, `logout…` or
`analyze…` contains **both** the exact command that was executed and the real
response body (pretty-printed JSON), e.g.

```
$ curl -s "http://127.0.0.1:8000/djangoapp/get_dealers/Kansas"
{"status": 200, "dealers": [ ... ]}
```

They were produced by `tools/make_curl_artifacts.py` against the running Django
server and against the deployment in `deploymentURL`.

---

## 3. Accounts

| Purpose | Username | Password |
|---|---|---|
| Customer (used in every screenshot) | `carsuser` | `Cars@2026` |
| Django admin superuser | `root` | `root12345` |

---

## 4. Caveats (please read before grading)

1. **Deployment.** The public URL is a Cloudflare Quick Tunnel to the Django
   server running on the development machine — *not* IBM Cloud Code Engine. No
   IBM Cloud account / API key / Docker daemon was available while building this
   project. All Code Engine artefacts (`Dockerfile`, `Dockerfile.sentiment`,
   `docker-compose.yml`, `k8s/*.yaml`, `deploy-code-engine.sh`) are committed and
   the container images are built by the CI job *Build deployment images*, so
   replacing the tunnel with a Code Engine URL is a matter of running
   `./deploy-code-engine.sh`. Because it is a tunnel, the URL stops responding
   once the tunnel process is closed — restart it with
   `cloudflared tunnel --url http://127.0.0.1:8000`.
2. **Database.** SQLite is used (the assignment allows MongoDB/PostgreSQL only as
   alternatives); the same models/dump are available for MongoDB in
   `server/database/app.js`.
3. **Sentiment service** runs on port **5050** (port 5000 was already in use on
   the build machine). Django reads it from `SENTIMENT_ANALYZER_URL`.
