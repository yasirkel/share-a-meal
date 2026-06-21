# Share-a-Meal Programmeren 4

Backend REST API 

## Tech Stack

- Node.js JavaScript
- Express REST API
- MySQL with `mysql2`
- JWT authentication
- bcrypt password hashing
- Mocha, Chai and Supertest
- GitHub Actions CI/CD
- Render Free Web Service
- Aiven Free MySQL

## Install

```shell
npm install
```

Use Node.js 20 or newer.

For local configuration, copy `.env.example` to `.env` and fill in your own local values.
Never commit `.env`. It is ignored by Git.
For variable names, see `.env.example` and `.env.production.example`.

## Database Setup

Create the MySQL schema:

```shell
mysql -u root -p < database/schema.sql
```

Optional demo data:

```shell
mysql -u root -p share_a_meal < database/seed.sql
```

Demo users in `seed.sql` use the password `Password123!`.
The database uses these tables: `user`, `meal` and `meal_participants`.

## Run App And Tests

Development server:

```shell
npm run dev
```

Production-style start:

```shell
npm start
```

Run tests:

```shell
npm test
```

The API defaults to `http://localhost:3000`.
Health check: `GET /api/info`.

## Main API Endpoints

All responses use:

```json
{
  "status": 200,
  "message": "Human readable message",
  "data": {}
}
```

Info:

- `GET /api/info`

Authentication:

- `POST /api/login`

Users:

- `POST /api/user`
- `GET /api/user`
- `GET /api/user/profile`
- `GET /api/user/:userId`
- `PUT /api/user/:userId`
- `DELETE /api/user/:userId`

Meals:

- `POST /api/meal`
- `GET /api/meal`
- `GET /api/meal/:mealId`
- `PUT /api/meal/:mealId`
- `DELETE /api/meal/:mealId`

Participants:

- `POST /api/meal/:mealId/participate`
- `DELETE /api/meal/:mealId/participate`
- `GET /api/meal/:mealId/participants`
- `GET /api/meal/:mealId/participants/:userId`

Passwords are hashed with bcrypt and are not returned in API responses.
Protected endpoints require a Bearer token.

## Git Flow

- `main` is the final hand-in branch.
- `development` collects approved feature branches.
- Work is done on feature branches.
- Feature branches are pushed to origin.
- Feature branches are merged into `development` only after approval.
- `main` is not changed directly.

## CI/CD

GitHub Actions uses `.github/workflows/ci-cd.yml`.

The pipeline runs tests on:

- push to `development`
- push to `main`
- pull requests targeting `development`
- pull requests targeting `main`

On a direct push to `main`, deployment is triggered only after tests pass.
The Render deploy hook is stored as a GitHub Actions secret and must never be committed.

## Deployment Summary

The deployed backend runs on Render Free Web Service.
The online MySQL database runs on Aiven Free MySQL.

Configure production environment variables in Render.
Do not put production values in source files or README.
Use `.env.example` and `.env.production.example` only as checklists for variable names.

Render settings:

- Build Command: `npm install`
- Start Command: `npm start`
- Health check: `GET /api/info`
- Test deployment branch: `feature/deployment`
- Final deployment branch: `main`

Free-tier wake-up note:

- Render Free may spin down after inactivity.
- Aiven Free MySQL may power off after inactivity.
- Before assessment or demo, open Aiven and make sure the MySQL service is `Running`.
- Then open `GET /api/info` and `GET /api/meal` on the Render URL to wake the app and verify database access.

Live URL:

```text
https://share-a-meal-dqcl.onrender.com
```

Assessment deliverables are a zip from `main` and the deployed server URL.
After the deadline, do not change or redeploy `main`.
