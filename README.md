# TaskMate Pro

TaskMate Pro is a full-stack task reminder app built with React, Node.js, Express, MySQL, JWT authentication, and Twilio SMS alerts. Users can register, manage daily tasks, mark work as completed, and review daily/weekly performance reports.

## Project structure

```text
TaskMatePro/
  client/   React + Vite frontend
  server/   Express API, MySQL models, schedulers, Twilio alerts
```

## Backend features

- JWT auth for register, login, and protected routes.
- MySQL task storage with status tracking: `pending`, `done`, and `late`.
- Task reminder scheduler using `node-cron`.
- Twilio SMS alerts for task reminders.
- Daily, weekly, and overall performance report endpoints.
- Health check endpoint at `/api/health`.

## Local setup

### Server

```bash
cd server
cp .env.example .env
npm install
npm run setup-db
npm start
```

Required server variables are listed in `server/.env.example`. For local MySQL without SSL, set `DB_SSL=false`.

### Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The frontend reads the backend URL from `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Render deployment

This repo is a monorepo, so the backend service must use the `server` folder as its root. The previous Render failure was caused by deploy commands that did not match the backend package: the server had no `start` or `build` script, and Render can fail during build if it runs from the repo root instead of `server`.

### Option 1: Use the included Blueprint

The repo now includes `render.yaml`. In Render, create a Blueprint from this GitHub repository and fill the environment variables marked as secret/manual.

### Option 2: Create a Web Service manually

Use these Render settings:

```text
Runtime: Node
Root Directory: server
Build Command: npm ci
Start Command: npm start
Health Check Path: /api/health
```

Add these environment variables in Render:

```text
NODE_ENV=production
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=taskmate_pro
DB_SSL=true
JWT_SECRET=your-long-random-secret
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
CLIENT_URL=https://your-frontend-domain.com
```

Render provides the `PORT` variable automatically, so do not hard-code it.

Note: Render free web services spin down after inactivity. That is fine for testing the API, but SMS reminder schedulers are only reliable while the server is awake. Use a paid instance or a separate always-on scheduler/worker for production reminders.

## Database setup for production

Create a MySQL database with any hosted MySQL provider, then create the tables using one of these methods:

```bash
cd server
npm run setup-db
```

or import:

```text
server/models/schema.sql
```

Use production database credentials in `server/.env` locally before running `npm run setup-db`, or run the SQL directly in your database dashboard.

## Where to paste the deployed backend link

After Render deploys the backend, copy its URL and append `/api`.

Paste it in:

```text
client/.env
```

Example:

```env
VITE_API_URL=https://taskmate-pro-server.onrender.com/api
```

If the frontend is deployed separately, set the same `VITE_API_URL` environment variable in that frontend host and rebuild the frontend. Also set the backend Render `CLIENT_URL` variable to the deployed frontend origin, for example `https://taskmate-pro.vercel.app`.

## Useful scripts

### Server

```bash
npm start       # run Express API
npm run dev     # run API with node --watch
npm run build   # syntax-check backend files
npm run check   # same check used by build
npm run setup-db
```

### Client

```bash
npm run dev
npm run build
npm run preview
```
