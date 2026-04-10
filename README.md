# Keego - Bali Trip Planner

A full-stack Bali trip itinerary app with an **Ionic React mobile app** (Android) and a **Node.js/Express REST API** backend. Supports offline-first sync, ticket image uploads, and detailed activity tracking.

## Project Structure

```
keego/
├── server/                    # Standalone backend API
└── bali-trip-app/
    ├── client/                # Ionic React mobile app (Android)
    └── server/                # Backend API (used with the mobile app)
```

## Tech Stack

| Layer    | Tech                                      |
|----------|-------------------------------------------|
| Mobile   | Ionic 8, React 19, TypeScript, Capacitor  |
| Offline  | Dexie (IndexedDB)                         |
| Backend  | Node.js, Express.js                       |
| Database | MongoDB + Mongoose                        |
| Uploads  | Multer                                    |
| Build    | Vite                                      |

## Features

- Day-by-day trip itinerary management
- Offline-first sync via delta updates (`?since=timestamp`)
- Ticket image uploads per activity (up to 10MB)
- Activity details: location, Google Maps URL, GPS coordinates, booking refs, payment tracking (IDR/USD), transport mode, and more
- Android app via Capacitor

---

## Getting Started

### Backend (API Server)

```bash
cd bali-trip-app/server   # or cd server
npm install
npm start
```

**Environment Variables:**

| Variable    | Default                               | Description               |
|-------------|---------------------------------------|---------------------------|
| `PORT`      | `3001`                                | Server port               |
| `MONGO_URI` | `mongodb://localhost:27017/bali-trip` | MongoDB connection string  |

**Seed the database** with the initial Bali itinerary:

```bash
npm run seed
```

---

### Mobile App (Client)

```bash
cd bali-trip-app/client
npm install
```

Create a `.env` file in `bali-trip-app/client/`:

```
VITE_API_URL=http://localhost:3001
```

**Run in browser (dev):**

```bash
npm run dev
```

**Build and run on Android:**

```bash
npm run build
npx cap sync android
npx cap open android
```

---

## API Endpoints

| Method | Endpoint                         | Description                             |
|--------|----------------------------------|-----------------------------------------|
| GET    | `/api/health`                    | Health check                            |
| GET    | `/api/activities`                | Get all activities (supports `?since=`) |
| GET    | `/api/activities/day/:dayNumber` | Get activities for a specific day       |
| POST   | `/api/activities`                | Create a new activity                   |
| PUT    | `/api/activities/:id`            | Update an activity                      |
| DELETE | `/api/activities/:id`            | Soft-delete an activity                 |
| POST   | `/api/activities/:id/ticket`     | Upload a ticket image                   |
| GET    | `/api/sync`                      | Full data dump for client sync          |

### Delta Sync

```
GET /api/activities?since=<unix_timestamp_ms>
```

---

## Activity Schema

| Field                | Type     | Description                                                              |
|----------------------|----------|--------------------------------------------------------------------------|
| `dayNumber`          | Number   | Day of the trip                                                          |
| `date`               | String   | Date string                                                              |
| `time` / `endTime`   | String   | Start and end times                                                      |
| `title`              | String   | Activity name                                                            |
| `location`           | String   | Location name                                                            |
| `category`           | String   | `sightseeing`, `food`, `transport`, `adventure`, `relaxation`, `shopping`|
| `transport`          | String   | Mode of transport                                                        |
| `notes`              | String   | Additional notes                                                         |
| `googleMapsUrl`      | String   | Google Maps link                                                         |
| `latitude/longitude` | Number   | GPS coordinates                                                          |
| `bookingRef`         | String   | Booking reference                                                        |
| `confirmationNumber` | String   | Confirmation number                                                      |
| `ticketImages`       | [String] | Paths to uploaded ticket images                                          |
| `amount`             | Number   | Cost                                                                     |
| `currency`           | String   | `IDR` or `USD`                                                           |
| `paymentStatus`      | String   | `paid`, `pending`, or `free`                                             |
| `order`              | Number   | Sort order within the day                                                |
| `isDeleted`          | Boolean  | Soft delete flag                                                         |
| `updatedAt`          | Date     | Last updated timestamp (auto-managed)                                    |
