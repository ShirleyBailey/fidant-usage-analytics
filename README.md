# Fidant Usage Analytics

## Overview

This project implements a usage analytics system that tracks and visualizes user activity over time.

It provides:

* Daily usage aggregation (committed vs reserved)
* Rolling date range analytics
* Summary metrics (total, average, peak, streak)
* Optimized performance using a caching layer
* Simple frontend visualization

---

## Tech Stack

### Backend

* Node.js
* TypeScript
* Express
* Prisma ORM
* PostgreSQL
* Docker (for local DB)

### Frontend

* React (TypeScript)
* Axios
* Recharts

---

## Features

### 1. Usage Aggregation

* Aggregates events by `date_key`
* Separates:

  * `committed`
  * `reserved` (only within last 15 minutes)

---

### 2. Date Range Handling

* Generates continuous date ranges
* Fills missing dates with zero values

---

### 3. Summary Metrics

| Metric          | Description                                       |
| --------------- | ------------------------------------------------- |
| total_committed | Total usage over period                           |
| avg_daily       | Average usage per day                             |
| peak_day        | Day with highest usage                            |
| current_streak  | Consecutive days with usage (from today backward) |

---

### 4. Caching Strategy

To improve performance, a per-day caching mechanism is implemented.

* Table: `daily_usage_cache`
* Cache key: `(user_id, date_key)`
* Freshness window: **5 minutes**

#### Behavior:

* Cache hit → use cached values
* Cache miss → compute from events
* Cache stale → recompute and update

---

### 5. Frontend Visualization

* Bar chart for daily committed usage
* Progress bar for today's usage
* Summary statistics display

---

## Project Structure

```
fidant-usage-analytics/
├── src/
│   ├── modules/
│   │   └── usage/
│   │       ├── usage.service.ts
│   │       ├── usage.controller.ts
│   │       ├── usage.types.ts
│   │       └── usage.utils.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── date.ts
│   ├── middlewares/
│   │   └── auth.ts
│   └── app.ts
├── prisma/
│   └── schema.prisma
├── frontend/
│   └── src/components/UsageStats.tsx
├── .env.example
└── README.md
```

---

## Setup Instructions

### 1. Clone repository

```
git clone <repo-url>
cd fidant-usage-analytics
```

---

### 2. Start PostgreSQL (Docker)

```
docker run --name fidant-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fidant \
  -p 5433:5432 \
  -d postgres
```

---

### 3. Configure environment

Create `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/fidant"
```

---

### 4. Run Prisma

```
npx prisma generate
npx prisma db push
```

---

### 5. Start backend

```
npm install
npm run dev
```

Server runs on:

```
http://localhost:3000
```

---

### 6. Start frontend

```
cd frontend
npm install
npm start
```

---

## API

### GET /api/usage/stats

#### Query Params

| Param | Description           |
| ----- | --------------------- |
| days  | Number of days (1–90) |

#### Example

```
GET /api/usage/stats?days=7
```

---

### Response

```json
{
  "plan": "starter",
  "daily_limit": 30,
  "period": {
    "from": "2026-03-27",
    "to": "2026-04-02"
  },
  "days": [
    {
      "date": "2026-04-02",
      "committed": 4,
      "reserved": 1,
      "limit": 30,
      "utilization": 0.13
    }
  ],
  "summary": {
    "total_committed": 4,
    "avg_daily": 0.57,
    "peak_day": {
      "date": "2026-04-02",
      "count": 4
    },
    "current_streak": 1
  }
}
```

---

## Testing

You can test the API using:

* Browser
* curl
* Postman

Example:

```
curl "http://localhost:3000/api/usage/stats?days=7"
```

---

## Design Decisions

### 1. In-memory aggregation

Events are fetched once and aggregated in memory to avoid multiple DB queries.

---

### 2. Partial caching

Caching is applied per day instead of entire range to:

* Reduce recomputation
* Improve scalability

---

### 3. Freshness vs performance

A 5-minute cache window balances:

* Real-time accuracy
* Query efficiency

---

### 4. Streak calculation

Computed by iterating backward from the most recent day until a zero-usage day is encountered.

---

## Possible Improvements

* Add Redis for distributed caching
* Add authentication (JWT)
* Pagination for large datasets
* Real-time updates (WebSocket)
* UI enhancements (tooltips, multi-series chart)

---

## Conclusion

This project demonstrates:

* Data aggregation logic
* Performance optimization via caching
* Clean API design
* Basic frontend visualization

---

## Author

Shirley Bailey
