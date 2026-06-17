# TrekNest – Adventure Tourism & Trek Booking Platform

TrekNest is a production-ready, full-stack application connecting mountain organizers, local guides, and trekkers.

## Project Structure

```
treknest/
├── backend/            # Node.js + Express API server (port 5000)
└── frontend/           # React + Vite + Tailwind frontend application (port 5173)
```

## Database Setup

1. **MongoDB Atlas**: Follow the detailed cluster setup instructions in your `implementation_plan.md`.
2. Retrieve your connection URI (e.g. `mongodb+srv://...`) and write it into `backend/.env` as `MONGO_URI`.
3. *Note: If `MONGO_URI` is omitted from variables, the server automatically starts in a Local File Database mode (saving records to `backend/data/db.json`) allowing you to run and test all bookings, payments, and dashboards immediately without setting up external accounts.*

## Quick Start

### 1. Start backend server
```bash
cd backend
# Create your .env file
copy .env.example .env
# Start local server
npm run dev
```

### 2. Start frontend app
```bash
cd frontend
# Launch development workspace
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## Built-In Seed Accounts

Use these credentials to sign in and test different user dashboards:
* **Trekker/User**: `trekker@treknest.com` | Password: `password123` (View bookings, badges, and wishlist)
* **Organizer/Trek Leader**: `organizer@treknest.com` | Password: `password123` (Verify attendance, manage events, manage subscriptions)
* **Local Guide**: `guide@treknest.com` | Password: `password123` (Manage guide listing, review earnings logs)
* **Admin**: `admin@treknest.com` | Password: `password123` (Verify leaders and guides, moderate reviews, view metrics)
