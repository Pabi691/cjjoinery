# CJ Joinery CRM Web App

A lightweight CRM frontend for managing projects, workers, and dashboard reporting. Built with React, Vite, and Tailwind.

## Features
- Login and signup screens
- Dashboard overview with KPIs and revenue chart
- Project list, filters, create/edit flow, and detail view
- Worker list, create/edit flow, and worker profiles
- Theme toggle (light/dark)
- Worker credentials and notifications from mobile updates

## Demo Admin Login
- Email: admin@cjjoinery.com
- Password: password123

## Backend vs Mock API
The app uses the backend API by default.

To use the mock API instead, set:
`VITE_USE_MOCK=true`

If you want to override the backend URL, set:
`VITE_API_URL=http://localhost:5000/api`

## Run Locally
1. Install dependencies.
2. Start the dev server.

```bash
npm install
npm run dev
```
