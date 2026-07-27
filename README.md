# Team Allocation Manager

A full-stack internal tool for managing team members, projects, and allocations. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Neon PostgreSQL.

## Features

- **Dashboard** — overview of total members, projects, recent allocations, and members per project.
- **Members** — add, edit, and delete team members.
- **Projects** — add, edit, and delete projects.
- **Allocations** — assign members to projects with a percentage (0-100%) and optional date range.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend:** Next.js API routes (App Router Route Handlers)
- **Database:** Neon PostgreSQL
- **Client:** `@neondatabase/serverless`

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── members/route.ts
│   │   ├── projects/route.ts
│   │   └── allocations/route.ts
│   ├── allocations/page.tsx
│   ├── members/page.tsx
│   ├── projects/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── navigation.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── empty-state.tsx
│       ├── input.tsx
│       ├── loading.tsx
│       └── select.tsx
├── lib/
│   ├── api.ts
│   ├── db.ts
│   └── types.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── next.config.ts
├── package.json
└── README.md
```

## Prerequisites

- Node.js 20+ and npm
- A Neon PostgreSQL project (free tier works fine)

## Getting Started

### 1. Clone / open the project

```bash
cd team-allocation-manager
npm install
```

### 2. Set up Neon

1. Go to [https://neon.tech](https://neon.tech) and create a new project.
2. Once the project is ready, open the project dashboard.
3. Go to **Connection Details** and copy the **PostgreSQL connection string**.
   - It looks like `postgresql://username:password@host.neon.tech/database?sslmode=require`.
   - Use a connection string with a role that has read/write privileges (the default `neondb_owner` role is fine).

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Replace the placeholder with your Neon connection string:

```env
DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require
```

> **Important:** `DATABASE_URL` is server-side only. It is used by Next.js API routes and is never exposed to the browser.

### 4. Run the database migration

You can apply the schema in two ways.

#### Option A — Neon SQL Editor (quickest)

1. Open your Neon dashboard.
2. Go to **SQL Editor → New query**.
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`.
4. Click **Run**.

#### Option B — psql (or any PostgreSQL client)

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql
```

> Replace `DATABASE_URL` with your actual Neon connection string or export it as an environment variable.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

### 1. Push to GitHub

This repository is already initialized with `git`. Create a new private or public repository on GitHub and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/team-allocation-manager.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Import the GitHub repository.
3. Add the following environment variable in the Vercel project settings:
   - `DATABASE_URL` — your Neon PostgreSQL connection string
4. Click **Deploy**.

> Make sure `DATABASE_URL` is added as a Vercel environment variable and is **not** exposed to the client.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/members` | List all members |
| POST | `/api/members` | Create a member |
| PUT | `/api/members` | Update a member |
| DELETE | `/api/members?id=...` | Delete a member |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a project |
| PUT | `/api/projects` | Update a project |
| DELETE | `/api/projects?id=...` | Delete a project |
| GET | `/api/allocations` | List all allocations with member/project details |
| POST | `/api/allocations` | Create an allocation |
| PUT | `/api/allocations` | Update an allocation |
| DELETE | `/api/allocations?id=...` | Delete an allocation |

## Notes

- This app intentionally has **no authentication**. Keep it behind a trusted network.
- `DATABASE_URL` gives full database access. Keep it secret and rotate it if it is ever exposed.
- API routes use parameterized SQL queries to prevent SQL injection.

## License

MIT
