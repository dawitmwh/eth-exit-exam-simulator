# Exit Examiner

A modern exam preparation demo with a Django REST backend and a React + Vite frontend.

## Quick links
- Backend entry: [backend/manage.py](backend/manage.py)  
- Backend settings: [backend/config/settings.py](backend/config/settings.py)  
- API routes: [backend/config/urls.py](backend/config/urls.py)  
- Exam serializers: [`ExamAttemptSerializer`](backend/exams/serializers.py) in [backend/exams/serializers.py](backend/exams/serializers.py)  
- Frontend README: [frontend/README.md](frontend/README.md)  
- Frontend package: [frontend/package.json](frontend/package.json)  
- Mock auth: [frontend/src/app/contexts/AuthContext.tsx](frontend/src/app/contexts/AuthContext.tsx)

## Prerequisites
- Python 3.10+ and pip
- Node 18+ and pnpm (or npm)
- (Optional) Git

## Backend (Django) - quick start
1. Create and activate a virtualenv:
   ```sh
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   source .venv/bin/activate # macOS/Linux
   ```
2. Install requirements:
   ```sh
   pip install -r backend/requirements.txt
   ```
3. Run migrations and create superuser:
   ```sh
   python backend/manage.py migrate
   python backend/manage.py createsuperuser
   ```
4. Start the dev server:
   ```sh
   python backend/manage.py runserver
   ```

API routes are registered in [backend/config/urls.py](backend/config/urls.py). Serializers and exam logic live under [backend/exams/serializers.py](backend/exams/serializers.py).

## Frontend (React + Vite) - quick start
1. From the repo root:
   ```sh
   cd frontend
   pnpm install      # or npm install
   pnpm dev          # or npm run dev
   ```
2. Open http://localhost:5173

The demo uses mock auth stored in [frontend/src/app/contexts/AuthContext.tsx](frontend/src/app/contexts/AuthContext.tsx). See [frontend/README.md](frontend/README.md) and [frontend/AUTH_GUIDE.md](frontend/AUTH_GUIDE.md) for more details.

## Environment
- Backend: adjust settings in [backend/config/settings.py](backend/config/settings.py) for production (SECRET_KEY, DEBUG, ALLOWED_HOSTS, DB).
- Frontend: create `.env` with VITE_API_URL if you point to a running backend (see [frontend/README.md](frontend/README.md)).

## Tests
- Django tests: `python backend/manage.py test`
- Frontend: see scripts in [frontend/package.json](frontend/package.json)

## Extending / Notes
- The frontend currently uses in-memory/mock users; integrate real auth by replacing logic in [frontend/src/app/contexts/AuthContext.tsx](frontend/src/app/contexts/AuthContext.tsx).
- The API uses DRF; JWT support is wired in [backend/config/urls.py](backend/config/urls.py) via simplejwt.

## Contributing
- Make a branch, run tests, open a PR. Keep changes small and focused.

// filepath: e:\dave\Technology\ExitExam\README.md
# Exit Examiner

A modern exam preparation demo with a Django REST backend and a React + Vite frontend.

## Quick links
- Backend entry: [backend/manage.py](backend/manage.py)  
- Backend settings: [backend/config/settings.py](backend/config/settings.py)  
- API routes: [backend/config/urls.py](backend/config/urls.py)  
- Exam serializers: [`ExamAttemptSerializer`](backend/exams/serializers.py) in [backend/exams/serializers.py](backend/exams/serializers.py)  
- Frontend README: [frontend/README.md](frontend/README.md)  
- Frontend package: [frontend/package.json](frontend/package.json)  
- Mock auth: [frontend/src/app/contexts/AuthContext.tsx](frontend/src/app/contexts/AuthContext.tsx)

## Prerequisites
- Python 3.10+ and pip
- Node 18+ and pnpm (or npm)
- (Optional) Git

## Backend (Django) - quick start
1. Create and activate a virtualenv:
   ```sh
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   source .venv/bin/activate # macOS/Linux
   ```
2. Install requirements:
   ```sh
   pip install -r backend/requirements.txt
   ```
3. Run migrations and create superuser:
   ```sh
   python backend/manage.py migrate   python backend/manage.py createsuperuser
   ```
4. Start the dev server:
   ```sh
   python backend/manage.py runserver
   ```

API routes are registered in [backend/config/urls.py](backend/config/urls.py). Serializers and exam logic live under [backend/exams/serializers.py](backend/exams/serializers.py).

## Frontend (React + Vite) - quick start
1. From the repo root:
   ```sh
   cd frontend
   pnpm install      # or npm install
   pnpm dev          # or npm run dev
   ```
2. Open http://localhost:5173

The demo uses mock auth stored in [frontend/src/app/contexts/AuthContext.tsx](frontend/src/app/contexts/AuthContext.tsx). See [frontend/README.md](frontend/README.md) and [frontend/AUTH_GUIDE.md](frontend/AUTH_GUIDE.md) for more details.

## Environment
- Backend: adjust settings in [backend/config/settings.py](backend/config/settings.py) for production (SECRET_KEY, DEBUG, ALLOWED_HOSTS, DB).
- Frontend: create `.env` with VITE_API_URL if you point to a running backend (see [frontend/README.md](frontend/README.md)).

## Tests
- Django tests: `python backend/manage.py test`
- Frontend: see scripts in [frontend/package.json](frontend/package.json)

## Extending / Notes
- The frontend currently uses in-memory/mock users; integrate real auth by replacing logic in [frontend/src/app/contexts/AuthContext.tsx](frontend/src/app/contexts/AuthContext.tsx).
- The API uses DRF; JWT support is wired in [backend/config/urls.py](backend/config/urls.py) via simplejwt.

## Contributing
- Make a branch,