# Job Tracker

A full-stack job application tracker for organizing job searches in one place. The project includes an Express and PostgreSQL API plus a Next.js frontend for authentication and application management.

## Features

- Create an account and sign in securely with cookie-based JWT authentication
- Create, view, update, and delete job applications
- Track application status: `applied`, `interview`, `offer`, `rejected`, or `withdrawn`
- Store job details including company, location, work mode, employment type, salary, URL, source, and notes
- Keep each user's applications isolated from other users
- Responsive dashboard with light and dark themes

## Project structure

```text
.
├── src/                    # Express API
├── migrations/             # PostgreSQL migrations
├── job-tracker-frontend/   # Next.js frontend
├── package.json            # Backend scripts and dependencies
└── .env.example            # Backend environment template
```

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer

## Getting started

### 1. Configure the backend

From the repository root, install dependencies and create a local environment file:

```bash
npm install
cp .env.example .env
```

Update `.env` with your PostgreSQL and application settings:

```dotenv
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_USER=yourusername
DB_PASSWORD=yourpassword
DB_NAME=job_tracker
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:3000
```

`JWT_SECRET` is required. `CLIENT_URL` must match the frontend origin so credentialed requests are accepted by the API.

### 2. Run database migrations

Create the database named in `DB_NAME`, then run the migrations. `node-pg-migrate` uses a PostgreSQL connection string, so provide `DATABASE_URL` when running the migration command:

```bash
DATABASE_URL=postgres://yourusername:yourpassword@localhost:5432/job_tracker npm run migrate -- up
```

The migrations create the `users`, `jobs`, and `applications` tables and connect applications to their owning users.

### 3. Configure the frontend

Install the frontend dependencies:

```bash
cd job-tracker-frontend
npm install
```

The frontend defaults to `http://localhost:5001` for the API. To use another API URL, create `job-tracker-frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### 4. Start both applications

Run the backend from the repository root:

```bash
npm run dev
```

In a second terminal, run the frontend:

```bash
cd job-tracker-frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API health check is available at [http://localhost:5001/api/health](http://localhost:5001/api/health).

## Scripts

### Backend

Run these commands from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with automatic reloads |
| `npm run build` | Compile the TypeScript API to `dist/` |
| `npm start` | Start the compiled API |
| `npm run migrate -- up` | Apply pending PostgreSQL migrations |

### Frontend

Run these commands from `job-tracker-frontend/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the frontend for production |
| `npm start` | Start the production Next.js server |
| `npm run lint` | Run ESLint |

## API overview

All application routes require the authentication cookie created by registration or login.

### Authentication

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Sign in and set the authentication cookie |
| `POST` | `/api/auth/logout` | Clear the authentication cookie |
| `GET` | `/api/auth/me` | Get the current user's profile |

### Applications

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/application` | Create a job application |
| `GET` | `/api/application` | List the signed-in user's applications |
| `GET` | `/api/application/:id` | Get one application |
| `PUT` | `/api/application/:id` | Update job or application details |
| `DELETE` | `/api/application/:id` | Delete an application |

Create and update requests use separate `job` and `application` objects. For example:

```json
{
  "job": {
    "title": "Software Engineer",
    "companyName": "Example Inc.",
    "workMode": "remote",
    "location": "Worldwide",
    "jobUrl": "https://example.com/jobs/123"
  },
  "application": {
    "status": "applied",
    "notes": "Submitted through the company careers page"
  }
}
```

Allowed work modes are `remote`, `hybrid`, and `onsite`. Optional job and application fields may be omitted or set to `null`.

## Security notes

- Passwords are hashed with bcrypt before storage.
- Authentication tokens are stored in HTTP-only cookies.
- API input is validated with Zod.
- Helmet and CORS are enabled on the API.
- Do not commit `.env`, production secrets, or real database credentials.