# GrindLog

**GrindLog** is a typography-first personal growth journal. Designed with a clean, editorial look, it lets you log what you did each day (with photo proof), then see your consistency at a glance on a yearly heatmap.

## ✨ Features

- **Log Your Day**: A popup form on the dashboard with the date and weekday prefilled (today or yesterday only). Add as many entries as you need, each with a description, an optional series, and optional photos (screenshots, camera shots, git history, anything).
- **Series per entry**: Pick a series for each entry, or use "Select series for all entries" to apply one to the whole form. Leaving it blank is fine.
- **Interactive Yearly Heatmap**: A static January-December grid (weeks run Monday to Sunday). Colour intensity reflects how many entries were logged that day. Hover or tap a day to open a popup with that day's entries and photos. A year picker at the top right switches between years (GrindLog started in 2026).
- **Photo proof on Cloudinary**: Photos are shrunk in the browser, uploaded directly to Cloudinary with signed requests, and shown as thumbnails with a click-to-enlarge lightbox.
- **Timed Series & Timelines**: Group entries into challenges or timelines (e.g., "100 Days of Code"). Each series page lists its entries day by day.
- **Streaks & Stats**: Current streak (consecutive days with at least one entry), total days logged, and total entries.
- **Secure Admin Gate**: Logging and deleting entries and managing series is admin-only. Guests get read-only access to the heatmap and series.

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

# Cloudinary (proof-of-work photos)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### 3. Database Push

Apply the Prisma schema to your PostgreSQL instance:

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
│   ├── schema.prisma   # Database schema (Series, DayEntry, EntryImage)
├── src/
│   ├── app/
│   │   ├── actions.ts  # Database-safe server actions
│   │   ├── layout.tsx  # Global layout, header (nav, theme toggle, logout)
│   │   ├── page.tsx    # Dashboard: stats, "Log your day" popup, heatmap with day popups
│   │   ├── login/      # Secure password authentication
│   │   ├── series/     # Trackable challenges & timelines (e.g. 100 Days of Code)
│   │   └── globals.css # App styling imports and Tailwind configuration
│   ├── components/     # Reusable components (Heatmap, LogDayModal, EntryList)
│   └── lib/
│       ├── auth.ts     # Session token and auth guards
│       ├── cloudinary.ts # Signed uploads and image deletion (server)
│       ├── images.ts   # Image URL transforms and client-side compression
│       ├── links.ts    # Central social links configuration
│       ├── prisma.ts   # Prisma client singleton with adapter-pg
│       └── types.ts    # Shared TS interfaces and types
```

---

## 🔐 Administration

Navigate to `/login` manually and sign in with your `ADMIN_PASSWORD`. Once authenticated, you can:
- Use the **Log your day** button on the dashboard to add entries and photos.
- Delete entries (and their photos) from the heatmap day popup.
- Create, edit, end and delete **Series**.
- Log out with the **Logout** button next to the theme toggle in the header.
