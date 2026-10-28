# Cars Dealership — Full-Stack Capstone Project

**Cars Dealership** is a national car retailer in the United States. This repository
contains the complete full-stack web application built for the
*Full-Stack Development Capstone*: a responsive React + Django application that
lists every dealership branch, shows verified customer reviews and lets
signed-in customers post new reviews that are scored by a dedicated
sentiment-analysis micro-service.

| | |
|---|---|
| **Project name** | Cars Dealership — National Car Retailer Portal |
| **Application type** | Full-stack web application (Django + React + Flask) |
| **Primary language** | Python 3.10 / JavaScript (ES2020) |
| **Databases** | SQLite (default) · MongoDB (seed loader included) · PostgreSQL (optional) |
| **Deployment** | Docker · Kubernetes · IBM Cloud Code Engine |
| **CI/CD** | GitHub Actions (`.github/workflows/ci.yml`) |
| **Live demo** | see [`deploymentURL`](deploymentURL) |
| **Author** | Laxmikant Kadam |

---

## 1. Project overview

Cars Dealership operates twelve branches in six states (Kansas, California,
Texas, New York, Florida and Illinois). Customers use the portal to:

* browse **all dealership branches** on the home page;
* **filter dealerships by state** (for example all branches in Kansas);
* open a **dealer detail page** that shows the address, contact details,
  opening hours and every customer review;
* **sign up / log in** and **post a review** for a dealership;
* see each review annotated with the **sentiment** (positive / neutral /
  negative) produced by the Flask sentiment micro-service;
* manage the catalogue (car makes, car models, dealers and reviews) through the
  **Django admin site**, including the root (superuser) account.

### Feature checklist

- [x] Responsive landing page with a dealership carousel/grid and state filter
- [x] "About Us" page with company history, values, leadership team (names,
      roles, bios and email addresses) and milestone timeline
- [x] "Contact Us" page with head-office address, phone numbers, department
      e-mail addresses, opening hours, message form and dealership map card
- [x] User registration (username, first name, last name, email, password)
- [x] Session-based login / logout REST API (`/djangoapp/login`,
      `/djangoapp/logout`) plus server-rendered login and sign-up pages
- [x] Dealer REST APIs (all dealers, dealers by state, dealer by id, reviews)
- [x] Car makes and models API (12 makes, 50 models)
- [x] Review submission with automatic sentiment analysis
- [x] Django admin customised for Car Make, Car Model, Dealer and Review
- [x] Seed data loader for SQLite (`manage.py seed_db`) and MongoDB (`npm run seed`)
- [x] Unit tests for the API, the pages and the sentiment analyser
- [x] Docker images for both services, Kubernetes manifests and a Code Engine
      deployment script
- [x] GitHub Actions pipeline: Django tests, Flask tests, React production build
      and Docker image builds

---

## 2. Architecture

```
                    ┌──────────────────────────────────────────────┐
  Browser  ────────▶│  Django  (djangoproj + djangoapp)            │
  (responsive UI)   │  • server-rendered pages (index, About,       │
                    │    Contact, Login, Register, Dealer)         │
                    │  • REST API under /djangoapp/                │
                    │  • Django admin at /admin/                   │
                    └───────┬───────────────────────┬──────────────┘
                            │ SQLite / PostgreSQL   │ HTTP (JSON)
                            ▼                       ▼
                    ┌───────────────┐      ┌────────────────────────┐
                    │  Database     │      │ Flask sentiment service │
                    │  dealers      │      │ POST /analyze           │
                    │  car makes    │      │ → positive / neutral /  │
                    │  reviews      │      │   negative              │
                    └───────────────┘      └────────────────────────┘
                            ▲
                            │ optional seed loader
                    ┌───────────────┐
                    │ MongoDB       │
                    │ (server/      │
                    │  database)    │
                    └───────────────┘
```

* **Django** serves the pages, exposes the REST API and runs the admin site.
* **React** (`server/frontend/src`) is the SPA front end used for the
  registration, login, dealer-list and review flows; it talks to the same
  `/djangoapp` API.
* **Flask** (`sentiment_analyzer`) is an independent micro-service that scores
  review text; the Django API falls back to the bundled lexicon analyser if the
  service is unavailable.
* **Docker / Kubernetes / Code Engine** configuration lives in `Dockerfile`,
  `sentiment_analyzer/Dockerfile`, `k8s/` and `deploy-code-engine.sh`.

---

## 3. Repository structure

```
CarDealership/
├── README.md
├── manage.py
├── requirements.txt
├── djangoproj/                 # Django project (settings, urls, page views)
├── djangoapp/                  # Django application
│   ├── models.py               # CarMake, CarModel, Dealer, Review
│   ├── admin.py                # Admin registration for all models
│   ├── restapis.py             # Dealer / car / review / sentiment REST API
│   ├── views.py                # Login, logout and register API
│   ├── urls.py                 # /djangoapp/... routes
│   ├── tests.py                # API + page tests
│   └── management/commands/seed_db.py
├── server/
│   ├── database/               # JSON seed data + MongoDB loader (Node.js)
│   └── frontend/
│       ├── package.json        # React (Create React App) project
│       ├── public/
│       ├── src/                # React components (Register, Login, Dealers…)
│       └── static/             # Django served pages + css + images
│           ├── index.html
│           ├── About.html
│           ├── Contact.html
│           ├── Login.html
│           ├── Register.html
│           ├── Dealer.html
│           ├── css/styles.css
│           ├── js/…
│           └── images/…
├── sentiment_analyzer/         # Flask micro-service + tests + Dockerfile
├── k8s/                        # Kubernetes deployment, service, ingress
├── .github/workflows/ci.yml    # GitHub Actions pipeline
├── Dockerfile
├── docker-compose.yml
└── deploy-code-engine.sh
```

---

## 4. Getting started

### 4.1 Prerequisites

* Python 3.10+
* Node.js 18+ (only for the React front end)
* Git

### 4.2 Backend (Django)

```bash
# 1. create and activate a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate

# 2. install dependencies
pip install -r requirements.txt

# 3. create the database schema
python manage.py makemigrations
python manage.py migrate

# 4. load the dealership, car and review seed data
python manage.py seed_db

# 5. create the admin (root) user
python manage.py createsuperuser

# 6. start the development server
python manage.py runserver
```

The site is then available at <http://127.0.0.1:8000/> and the admin site at
<http://127.0.0.1:8000/admin/>.

### 4.3 Sentiment analysis micro-service (Flask)

```bash
pip install -r sentiment_analyzer/requirements.txt
python sentiment_analyzer/app.py            # http://127.0.0.1:5050
```

Override the endpoint used by Django with the `SENTIMENT_ANALYZER_URL`
environment variable (default `http://localhost:5050/analyze`).

### 4.4 Front end (React)

```bash
cd server/frontend
npm install
npm start                                   # http://127.0.0.1:3000
```

`npm run build` produces the production bundle in `server/frontend/build`.

### 4.5 MongoDB seed loader (optional)

```bash
cd server/database
npm install
MONGODB_URL="mongodb://localhost:27017" npm run seed
```

---

## 5. REST API

All endpoints are mounted under `/djangoapp/`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/djangoapp/get_dealers` | All dealership branches |
| `GET` | `/djangoapp/get_dealers/<state>` | Dealerships in one state (`Kansas`, `KS`, …) |
| `GET` | `/djangoapp/get_dealer/<id>` | One dealer with all of its reviews |
| `GET` | `/djangoapp/get_dealer_reviews?dealerId=<id>` | Reviews for a dealer |
| `GET` | `/djangoapp/get_cars` | All car makes with their models |
| `GET` | `/djangoapp/analyze/<text>` | Sentiment of a piece of text |
| `POST` | `/djangoapp/add_review` | Create a review (sentiment is computed) |
| `POST` | `/djangoapp/register` | Register a new customer account |
| `POST` | `/djangoapp/login` | Log in, returns the user name and status |
| `GET` | `/djangoapp/logout` | Log out the current session |
| `GET` | `/djangoapp/session` | Current session information |
| `GET` | `/djangoapp/health` | Service health probe |

### Example requests

```bash
# all dealers
curl -s http://127.0.0.1:8000/djangoapp/get_dealers

# dealers in Kansas
curl -s http://127.0.0.1:8000/djangoapp/get_dealers/Kansas

# dealer 1 with its reviews
curl -s http://127.0.0.1:8000/djangoapp/get_dealer/1

# reviews of dealer 1
curl -s "http://127.0.0.1:8000/djangoapp/get_dealer_reviews?dealerId=1"

# every car make and model
curl -s http://127.0.0.1:8000/djangoapp/get_cars

# sentiment analysis
curl -s http://127.0.0.1:8000/djangoapp/analyze/Fantastic%20services

# login (stores the session cookie)
curl -s -c cookies.txt -X POST http://127.0.0.1:8000/djangoapp/login \
     -H "Content-Type: application/json" \
     -d '{"userName": "carsuser", "password": "Cars@2026"}'

# logout
curl -s -b cookies.txt http://127.0.0.1:8000/djangoapp/logout
```

### Example responses

```json
// GET /djangoapp/get_dealers/Kansas
{
  "status": 200,
  "dealers": [
    {
      "id": 1,
      "full_name": "Cars Dealership - Wichita",
      "short_name": "Wichita",
      "address": "5150 N Webb Road",
      "city": "Wichita",
      "state": "Kansas",
      "st": "KS",
      "zip": "67208",
      "lat": 37.7234,
      "long": -97.2425
    }
  ]
}
```

```json
// GET /djangoapp/analyze/Fantastic%20services
{"status": 200, "text": "Fantastic services", "sentiment": "positive"}
```

---

## 6. Seeded data

| Entity | Rows | Notes |
|---|---|---|
| Dealers | 12 | Kansas (3), California (2), Texas (2), New York (2), Florida (1), Illinois (2) |
| Car makes | 12 | Toyota, Honda, Ford, BMW, Audi, Tesla, Chevrolet, Nissan, Hyundai, Kia, Subaru, Mercedes-Benz |
| Car models | 50 | sedans, SUVs, wagons, coupes, trucks and hatchbacks |
| Reviews | 12 | with purchase details and pre-computed sentiment |

---

## 7. Testing

```bash
# Django API + page tests
python manage.py test

# sentiment analyser unit tests
python -m unittest discover -s sentiment_analyzer/tests -v

# React production build (also run in CI)
cd server/frontend && npm run build
```

---

## 8. CI/CD with GitHub Actions

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

1. **backend-tests** — installs Python dependencies, runs `manage.py check`,
   applies migrations, loads the seed data and executes the Django test suite.
2. **sentiment-service-tests** — runs the analyser unit tests and smoke-tests
   the Flask `/analyze` endpoint.
3. **frontend-build** — installs the npm dependencies, builds the React
   application and uploads the bundle as an artefact.
4. **docker-image** — builds the Django and sentiment-analysis images.

Pipeline status: <https://github.com/laxmikant-kadam/cars-dealership-capstone/actions>

---

## 9. Deployment

### Docker Compose (local)

```bash
docker compose up --build
# Django      → http://localhost:8000
# Sentiment   → http://localhost:5050
```

### Kubernetes

```bash
docker build -t cars-dealership:1.0 .
docker build -t cars-dealership-sentiment:1.0 ./sentiment_analyzer
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### IBM Cloud Code Engine

```bash
ibmcloud login --sso
ibmcloud target -r us-south -g Default
./deploy-code-engine.sh
```

The script builds and pushes both images to IBM Cloud Container Registry,
creates the sentiment micro-service application and then the Django
application, wiring the sentiment URL into the Django environment. The
resulting URL is written to `deploymentURL`.

---

## 10. Capstone submission artefacts

| Task | Artefact | Location |
|---|---|---|
| 1 | README with project name | `README.md` |
| 2 | Django server output | `submission/django_server` |
| 3 | About Us page | `server/frontend/static/About.html` |
| 4 | Contact Us page | `server/frontend/static/Contact.html` |
| 5 | Login cURL | `submission/loginuser` |
| 6 | Logout cURL | `submission/logoutuser` |
| 7 | React sign-up page | `server/frontend/src/components/Register/Register.jsx` |
| 8 | Dealer reviews cURL | `submission/getdealerreviews` |
| 9 | All dealers cURL | `submission/getalldealers` |
| 10 | Dealer by id cURL | `submission/getdealerbyid` |
| 11 | Dealers by state cURL | `submission/getdealersbyState` |
| 12–13 | Admin login / logout screenshots | `submission/admin_login.png`, `submission/admin_logout.png` |
| 14–15 | Car makes cURL | `submission/getallcarmakes` |
| 16 | Sentiment analysis cURL | `submission/analyzereview` |
| 17–22 | Application screenshots | `submission/get_dealers.png` … `submission/added_review.png` |
| 23 | GitHub Actions output | `submission/CICD` |
| 24 | Deployment URL | `deploymentURL` |
| 25–28 | Deployed screenshots | `submission/deployed_*.png` |

---

## 11. Default demo account

The screenshots in `submission/` were captured with a demo customer account:

| Username | Password |
|---|---|
| `carsuser` | `Cars@2026` |

The Django admin (root) account is created locally with
`python manage.py createsuperuser`; credentials are never committed to the
repository.

---

## 12. License

Released for educational purposes as part of the IBM Full-Stack Development
Capstone.
