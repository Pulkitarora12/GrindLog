# GrindLog

**GrindLog** is a premium, typography-first personal productivity and placement preparation tracking dashboard. Designed with a clean, editorial look, it empowers users to define daily targets, link them to specific learning subtopics, track consistency, and generate automated end-of-day summaries.

---

## ✨ Features

- **Automated Target Tracking & End-Day Summaries**: Replace manual journal/blog writing with structured daily target checklists. Define target items and link them optionally to specific learning subtopics.
- **Interactive Consistency Heatmap**: A GitHub-style 365-day heat grid rendering daily activity levels based on target completion efficiency (0% to 100%) on closed days.
- **Efficiency Metrics & Day Locking**: Ending a day calculates the overall completion efficiency percentage. Once a day is closed, its targets and status are locked.
- **Curated Checklists (Tracks)**: Manage learning subjects (e.g., DSA, System Design) and track subtopics through states (`NOT_STARTED` ➜ `IN_PROGRESS` ➜ `DONE`).
- **Timed Series & Timelines**: Group daily summaries into challenges or timelines (e.g., "100 Days of Code") to track continuous progress.
- **Dynamic Streaks & Analytics**: Instantly computes daily consistency streaks for closed days, total tracked days, and comprehensive subtopic progress metrics.
- **Interactive Calendar Navigator**: Browse and select dates on a monthly grid to view target checklists and summary stats for any past day.
- **Secure Admin Gate**: Restricts daily target addition, completion toggling, ending days, and track editing to the admin (read-only access for guests).

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
│   ├── schema.prisma   # Database schema (Track, Subtopic, Series, DailyTarget, DaySummary)
├── src/
│   ├── app/
│   │   ├── actions.ts  # Database-safe server actions
│   │   ├── layout.tsx  # Global layout and social nav links
│   │   ├── page.tsx    # Dashboard, stats, heatmap, and daily targets list
│   │   ├── calendar/   # Interactive monthly calendar view with target lists
│   │   ├── feed/       # Searchable logs / summaries feed
│   │   ├── login/      # Secure password authentication
│   │   ├── series/     # Trackable challenges & timelines (e.g. 100 Days of Code)
│   │   ├── tracks/     # Tracks & subtopics checklist manager
│   │   └── globals.css # App styling imports and Tailwind configuration
│   ├── components/     # Reusable components (Heatmap, MonthlyCalendar)
│   └── lib/
│       ├── auth.ts     # Session token and auth guards
│       ├── links.ts    # Central social links configuration
│       ├── prisma.ts   # Prisma client singleton with adapter-pg
│       └── types.ts    # Common TS interfaces and types
```

---

## 🔐 Administration

To manage daily targets, close days, or edit checklists, navigate to `/login` manually. Once authenticated with your `ADMIN_PASSWORD`, you will be granted access to:
- Adding, toggling, and deleting daily targets on the dashboard.
- The **End Day** action to lock daily progress and calculate efficiency metrics.
- The **Manage Tracks & Subtopics** checklists.
- Creating and deleting progress **Series**.

