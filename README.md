# I AM GENESIS TOW — Backend

Step 1 (quote calculation) + Step 2 (real Postgres persistence) are both
done and tested. This README covers running it in **Google Cloud Shell**
and deploying to **Railway**.

## What's in here

```
genesis-tow-backend/
├── src/
│   ├── index.js         ← starts the server, defines /health
│   ├── db.js            ← shared Postgres connection pool
│   ├── pricing.js        ← quote math (pure logic, no web/db stuff)
│   └── routes/
│       └── jobs.js       ← POST /jobs/quote, POST /jobs, GET /jobs, GET /jobs/:id
├── migrations/
│   └── 001_create_jobs.sql
├── scripts/
│   └── migrate.js         ← runs migrations against DATABASE_URL
├── railway.json            ← explicit Railway build/start config
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API surface so far

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/jobs/quote` | Calculate a price, nothing saved |
| POST | `/jobs` | Calculate a price AND save a real Job row |
| GET | `/jobs` | List the 50 most recent jobs |
| GET | `/jobs/:id` | Fetch one job |

### POST /jobs — additional customer & location fields

Alongside `serviceType`, `pickup`, `dropoff`, `customerName`, and
`customerPhone`, the endpoint also accepts:

| Field | Type | Required | Notes |
|---|---|---|---|
| `customerPhoneAlt` | string | no | Optional secondary phone number |
| `with_vehicle` | boolean | no | Whether the customer is currently with the vehicle |
| `staying_with_vehicle` | boolean | no | Whether the customer will stay with the vehicle |
| `latitude` | number | no | GPS latitude of the customer's pickup location |
| `longitude` | number | no | GPS longitude of the customer's pickup location |
| `location_accuracy` | number | no | Accuracy of the GPS reading, in meters |

`latitude` and `longitude` must be provided together — sending only one of
them returns a `400` error. These fields power Lyft/Uber-style live driver
tracking and improve dispatch accuracy.

## Running it in Google Cloud Shell (local dev loop)

Cloud Shell gives you Node and git already, but not a running Postgres —
easiest path is to point your local dev straight at a **free Railway
Postgres** instance rather than installing Postgres inside Cloud Shell
(which resets between sessions anyway). Steps:

1. **Open Cloud Shell**, clone your repo (push this project to a GitHub
   repo first if you haven't):
   ```
   git clone <your-repo-url>
   cd genesis-tow-backend
   npm install
   ```

2. **Install the Railway CLI** (one-time, per Cloud Shell session unless
   you persist it):
   ```
   npm install -g @railway/cli
   railway login
   ```
   `railway login` will give you a URL to open and approve — Cloud Shell
   can open browser tabs fine for this.

3. **Link this folder to a Railway project:**
   ```
   railway init
   ```
   Choose "Create new project" and name it `genesis-tow`.

4. **Add a Postgres database to the project** — easiest done in the
   Railway web dashboard: open the project → "New" → "Database" →
   "Add PostgreSQL". Railway will provision it and expose `DATABASE_URL`
   to any service in that project automatically.

5. **Pull that DATABASE_URL down into Cloud Shell** so your local run can
   use the same real database:
   ```
   railway variables --service <your-service-name>
   ```
   Copy the `DATABASE_URL` value it prints into a local `.env`:
   ```
   cp .env.example .env
   # then edit .env and paste DATABASE_URL=<value>
   ```

6. **Run the migration** against that real Railway Postgres:
   ```
   npm run migrate
   ```

7. **Run the server:**
   ```
   npm start
   ```

8. **Test it** (open a second Cloud Shell tab, or use the built-in web
   preview on port 3000):
   ```
   curl http://localhost:3000/health

   curl -X POST http://localhost:3000/jobs \
     -H "Content-Type: application/json" \
     -d '{"serviceType":"tow","pickup":{"lat":33.7501,"lng":-84.3885},"dropoff":{"lat":33.7756,"lng":-84.2963},"customerName":"Jane Doe","customerPhone":"+14045551234","customerPhoneAlt":"+14045555678","with_vehicle":true,"staying_with_vehicle":true,"latitude":33.7501,"longitude":-84.3885,"location_accuracy":15}'

   curl http://localhost:3000/jobs
   ```

## Deploying to Railway

Once the above works locally against the same database, deploying is
just:

```
railway up
```

Railway reads `railway.json`, builds with Nixpacks, and runs `npm start`.
Because the Postgres plugin lives in the same Railway project, the
deployed app automatically receives the same `DATABASE_URL` — no manual
config needed in production.

To run the migration against production the first time (or after adding
new migration files):
```
railway run npm run migrate
```
`railway run` executes the command locally but injected with your
Railway project's environment variables — so it talks to the real
production database without you ever typing the connection string.

## What each file actually does (plain English)

- **`src/index.js`** — the front door. Starts the web server, listens on a
  port, and hands off `/jobs` requests to `routes/jobs.js`.
- **`src/db.js`** — the one shared Postgres connection pool. Everything
  that touches the database imports from here.
- **`src/pricing.js`** — the business logic. Given a service type and
  locations, works out a price. Zero knowledge of HTTP or the database —
  just math you could unit test on its own.
- **`src/routes/jobs.js`** — translates HTTP requests into calls to
  `pricing.js` and `db.js`, and sends back JSON.
- **`migrations/001_create_jobs.sql`** — the one SQL statement that
  defines the `jobs` table shape.
- **`scripts/migrate.js`** — runs every `.sql` file in `migrations/`, in
  order, against whatever `DATABASE_URL` currently points to (local or
  production — same script, different target).

## What's next (Step 3 preview)

Right now anyone can create a job with no login at all — there's no
concept of a driver, and no way to mark a job "accepted" or "completed."
Step 3 adds:
- User accounts (customer + driver) with real authentication
- A `status` transition endpoint (`requested → accepted → en_route → ...`)
- Assigning a specific driver to a job

Same process as always: small, tested against a real database, explained
before you touch it.
