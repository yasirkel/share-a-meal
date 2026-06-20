# Share-a-Meal Programmeren 4

Backend REST API for the HBO Programmeren 4 Share-a-Meal assignment.

## Tech Stack

- Node.js JavaScript
- Express REST API
- MySQL with `mysql2`
- JWT authentication with `jsonwebtoken`
- Password hashing with `bcrypt`
- Mocha, Chai and Supertest for automated tests
- Configuration through environment variables

## Project Structure

```text
src/
  app.js
  server.js
  config/
  controllers/
  dao/
  middleware/
  routes/
  services/
  validators/
database/
  schema.sql
  seed.sql
test/
```

## Installation

```shell
npm install
```

Use Node.js 20 or newer.

## Environment Variables

Copy `.env.example` to `.env` and fill in local or deployment values.

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=share_a_meal
DB_DATABASE=share_a_meal
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
DB_CONNECTION_LIMIT=10

STUDENT_NAME=Yasir Kelloulou
STUDENT_NUMBER=2212394
APP_DESCRIPTION=Backend REST API for the Share-a-Meal Programmeren 4 assignment

JWT_SECRET=replace-with-a-secure-secret
JWT_EXPIRES_IN=1h
```

Never commit `.env`. It is ignored by Git.

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

The schema includes:

- `user`
- `meal`
- `meal_participants`

Foreign keys use cascade behavior for participant cleanup and owner-related meal cleanup.
The API also deletes participant records before deleting a meal.

## Running Locally

Development server:

```shell
npm run dev
```

Production-style start:

```shell
npm start
```

Default URL:

```text
http://localhost:3000
```

Health/info endpoint:

```text
GET /api/info
```

## Running Tests

```shell
npm test
```

The test suite uses Mocha, Chai and Supertest. Database-dependent services are stubbed in API tests so the suite can run without a local MySQL server.

## API Response Format

All endpoints return JSON in this shape:

```json
{
  "status": 200,
  "message": "Human readable message",
  "data": {}
}
```

For errors, `data` is `null`.

## API Endpoints Overview

### Info

- `GET /api/info` - public API status/info

Returns API version, `studentName`, `studentNumber` and a short project description.

### Authentication

- `POST /api/login` - login with `emailAddress` and `password`

Successful login returns a JWT and user data without password.

### Users

- `POST /api/user` - register new user, public
- `GET /api/user` - get all users, JWT required
- `GET /api/user/profile` - get own profile, JWT required
- `GET /api/user/:userId` - get user by id, JWT required
- `PUT /api/user/:userId` - update own user only, JWT required
- `DELETE /api/user/:userId` - delete own user only, JWT required

Passwords are hashed with bcrypt and never returned in user responses.
`GET /api/user` supports at most 2 filters using these fields: `firstName`, `lastName`, `emailAddress`, `city`, `street`, `phoneNumber`, `isActive`.
Unsupported filter fields return `400` with a clear JSON error response.
`GET /api/user/profile` and `GET /api/user/:userId` include meals offered by that user; profile only includes meals from today or the future.

### Meals

- `POST /api/meal` - create meal, JWT required
- `GET /api/meal` - get all meals, public
- `GET /api/meal/:mealId` - get meal by id, public
- `PUT /api/meal/:mealId` - update own meal only, JWT required
- `DELETE /api/meal/:mealId` - delete own meal only, JWT required

The logged-in user becomes the cook/owner of a created meal.
Meal responses include cook data and a participants array where available.
Passwords are removed from nested user objects.

### Participants

- `POST /api/meal/:mealId/participate` - join a meal, JWT required
- `DELETE /api/meal/:mealId/participate` - leave a meal, JWT required
- `GET /api/meal/:mealId/participants` - list participants, meal owner only
- `GET /api/meal/:mealId/participants/:userId` - get participant detail, meal owner only

A user cannot join the same meal twice and cannot join when the meal is full.

## Validation Notes

The API validates required fields, email addresses, strong passwords, Dutch mobile phone numbers, positive prices, positive participant counts and ownership rules.
Passwords must be at least 8 characters and contain at least 1 uppercase letter and 1 digit.
Phone numbers must start with `06` and contain exactly 10 digits.

## CI/CD

GitHub Actions uses `.github/workflows/ci-cd.yml`.

The pipeline runs on:

- push to `development`
- push to `main`
- pull requests targeting `development`
- pull requests targeting `main`

The `test` job uses Node.js 20 and runs:

```shell
npm install
npm test
```

The `deploy` job only runs after the test job passes on a direct push to `main`.
It does not run on `development` and does not run for pull requests.
The deployment is triggered through a Render deploy hook stored as the GitHub Actions secret `RENDER_DEPLOY_HOOK_URL`.
Do not commit the deploy hook URL or any other secrets.

## Deployment Notes

This project can be deployed fully free with:

- Backend: Render Free Web Service
- Database: Aiven Free MySQL

### Render Free Web Service

Create a new Render Web Service from the GitHub repository.

Recommended settings for a test deploy:

- Branch: `feature/deployment`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Healthcheck: `GET /api/info`

For the final hand-in deploy, switch the Render branch to `main` after the final approved merge.
After a push to `main`, GitHub Actions runs the tests first and then calls the Render deploy hook when the tests pass.

Required GitHub repository secret:

```text
RENDER_DEPLOY_HOOK_URL
```

Set these Render environment variables:

```env
NODE_ENV=production
PORT=3000
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_DATABASE=
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_CONNECTION_LIMIT=10
JWT_SECRET=
JWT_EXPIRES_IN=1h
STUDENT_NAME=Yasir Kelloulou
STUDENT_NUMBER=2212394
APP_DESCRIPTION=Backend REST API for the Share-a-Meal Programmeren 4 assignment
```

Do not paste secrets into source files. Only add real values in Render's environment variable dashboard.
Render stores the production environment variables for the Aiven MySQL database and `JWT_SECRET`.

### Aiven Free MySQL

1. Create an Aiven MySQL service. Aiven hosts the online MySQL database for the deployed API.
2. Copy the connection details from Aiven into the Render env vars:
   - Aiven host -> `DB_HOST`
   - Aiven port -> `DB_PORT`
   - Aiven user -> `DB_USER`
   - Aiven password -> `DB_PASSWORD`
   - Aiven database name -> `DB_DATABASE`
3. Set `DB_SSL=true` for Aiven.
4. Keep `DB_SSL_REJECT_UNAUTHORIZED=false` unless you configure CA certificates separately.
5. Run `database/schema.sql` on the Aiven database.
6. Optionally run `database/seed.sql` for demo data.

### Generic Deployment Checklist

1. Provision a MySQL database.
2. Run `database/schema.sql` on the deployment database.
3. Configure environment variables on the hosting platform. Use `.env.production.example` as a checklist, but do not commit real production values.
4. Set a strong `JWT_SECRET`.
5. Install dependencies with `npm install`.
6. Start the server with `npm start`.
7. Verify `GET /api/info` on the public URL.

Minimal production command sequence:

```shell
npm install
npm start
```

Health check after deployment:

```text
GET https://your-deployed-api.example.com/api/info
```

Expected response shape:

```json
{
  "status": 200,
  "message": "Share-a-Meal API is running",
  "data": {
    "version": "1.0.0",
    "studentName": "Yasir Kelloulou",
    "studentNumber": "2212394",
    "description": "Backend REST API for the Share-a-Meal Programmeren 4 assignment"
  }
}
```

The server reads the port from `PORT`, database settings from `DB_*`, and JWT signing secret from `JWT_SECRET`.
The info endpoint reads student metadata from `STUDENT_NAME` and `STUDENT_NUMBER`, with safe defaults configured in the app.

The assignment deliverables are a zip from `main` and the deployed server URL. After the deadline, do not change or redeploy `main`.

## Git Flow

- `main` is the final hand-in branch.
- `development` collects approved feature branches.
- Work is done on feature branches:
  - `feature/project-setup`
  - `feature/auth`
  - `feature/users`
  - `feature/meals`
  - `feature/participants`
  - `feature/final-hardening`
  - `feature/deployment`
- Feature branches are pushed to origin.
- Feature branches are merged into `development` only after approval.
- `main` is not changed directly.

## Assessment and Demo Notes

Before demo or submission:

1. Pull the latest `development`.
2. Run `npm install`.
3. Create `.env` from `.env.example`.
4. Run the database schema script.
5. Run `npm test`.
6. Start the server with `npm start`.
7. Test `GET /api/info` and `POST /api/login`.

Keep the deployed URL and the final `main` zip ready for submission.
