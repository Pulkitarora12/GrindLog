# GrindLog

**GrindLog** is a premium, typography-first personal productivity and placement preparation tracking dashboard. Designed with a clean, editorial look, it empowers users to record daily logs, visualize coding consistency, organize structured tracks (like DSA or System Design), and document progress step-by-step.

---

## ✨ Features

- **Personalized Hero Section**: Welcoming header tailored for placement preparation tracking.
- **Interactive Consistency Heatmap**: A GitHub-style 365-day heat grid rendering daily entries and activity levels.
- **Dynamic Streaks & Metrics**: Instantly computes streaks, total logs, and total subtopic progress metrics.
- **Curated Checklists (Tracks)**: Manage learning subjects (e.g., DSA, Development) and track subtopics through states (`NOT_STARTED` ➜ `IN_PROGRESS` ➜ `DONE`).
- **Timed Series & Timelines**: Group entries into structured timelines (e.g., "100 Days of Code").
- **Interactive Calendar Navigator**: Browse, select, and view full daily logs directly on a monthly grid.
- **Secure Admin Gate**: Restricts entry creation, editing, and track modifications to the admin via a private endpoint, allowing read-only access for guest visitors.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Vercel Postgres (Neon)](https://vercel.com/docs/storage/vercel-postgres)
- **ORM**: [Prisma ORM v7](https://www.prisma.io/) (utilizing PG driver adapters for serverless efficiency)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Pulkitarora12/GrindLog.git
cd GrindLog
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory and add the following keys:

```env
# Database Connections
DATABASE_URL="postgres://..."
DATABASE_URL_UNPOOLED="postgres://..."

# Security and Credentials
ADMIN_PASSWORD="your-admin-password"
SESSION_SECRET="your-jwt-session-secret"
```

### 3. Database Push

Apply the Prisma schema migrations to your PostgreSQL instance:

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 📂 Project Structure

```
├── prisma/
│   ├── schema.prisma   # Database schema definitions
├── src/
│   ├── app/
│   │   ├── actions.ts  # Database-safe server actions
│   │   ├── layout.tsx  # Global layout and social nav links
│   │   ├── page.tsx    # Dashboard & Heatmap stats
│   │   ├── calendar/   # Interactive monthly calendar
│   │   ├── feed/       # Searchable logs feed
│   │   ├── login/      # Secure password authentication
│   │   └── tracks/     # Tracks checklist management
│   ├── components/     # Heatmap, Calendar, & Form components
│   └── lib/
│       ├── auth.ts     # Session token and auth guards
│       ├── links.ts    # Central social links configuration
│       └── prisma.ts   # Prisma client singleton with adapter-pg
```

---

## 🔐 Administration

To write daily entries or edit checklists, navigate to `/login` manually. Once authenticated with your `ADMIN_PASSWORD`, you will be granted access to:
- The **+ New Entry** editor.
- The **Manage Tracks** checklist editor.
- Editing and deleting logs from the feed or calendar views.
