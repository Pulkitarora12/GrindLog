# DevLog Project Walkthrough: What Does What?

Welcome to your **DevLog** repository! This file details the project layout, configurations, database layers, and front-end routes so you know exactly where everything lives and what each file does.

---

## 📁 1. Project Directory Layout

```text
BlogWebsite/
├── prisma/
│   ├── schema.prisma       # Database models (Track, Subtopic, Series, Entry)
│   └── migrations/         # Database migrations directory
├── src/
│   ├── app/                # Next.js App Router folders & pages
│   │   ├── actions.ts      # Server Actions (CRUD, Streaks, Heatmap data)
│   │   ├── layout.tsx      # Global shell, navbar, and fonts (Inter & Lora)
│   │   ├── globals.css     # CSS configurations (Tailwind CSS v4 & Prose styles)
│   │   ├── page.tsx        # Dashboard (Heatmap, Streaks, Recent Entries)
│   │   ├── calendar/       # Calendar browse page
│   │   ├── feed/           # Scrollable feed with filters
│   │   ├── new/            # Markdown editor (Write/Edit page)
│   │   ├── series/         # Log Series dashboard and timeline pages
│   │   └── tracks/         # Skill Track checklists manager
│   ├── components/         # Shared React Components
│   │   ├── DeleteEntryForm.tsx  # Client-side log delete confirm handler
│   │   ├── Heatmap.tsx          # GitHub-style 365-day grid contribution calendar
│   │   ├── MonthlyCalendar.tsx  # Monthly date grid navigator
│   │   └── Markdown.tsx         # Markdown parsing renderer
│   └── lib/
│       └── prisma.ts       # Prisma Client singleton using PostgreSQL driver-adapter
├── prisma.config.ts        # Prisma 7 global configurations
├── package.json            # Node.js dependencies & scripts
├── tsconfig.json           # TypeScript rules config
├── .env                    # Local environment settings (Git-ignored)
└── .env.local              # Vercel environment credentials (Git-ignored)
```

---

## 🗄️ 2. Database & ORM Layer

### 📄 `prisma/schema.prisma`
Defines the database schema using Postgres. It maps out:
- **`Track`**: Categorized trackers (e.g. "DSA").
- **`Subtopic`**: Checklists under a Track (e.g. "Arrays", "Graphs").
- **`Series`**: Themed sequential daily blogs (e.g. "365 Days of Code").
- **`Entry`**: Core logs containing date, optional title, markdown content, associated series tag, custom tag arrays, and implicit many-to-many references to completed subtopics.

### 📄 `prisma.config.ts` (Prisma 7 convention)
Prisma 7 no longer stores database credentials directly inside `schema.prisma`. Instead, this config file reads the environment variables (prioritizing the unpooled `DATABASE_URL_UNPOOLED` URL for migration tasks) and applies them during builds and migration commands.

### 📄 `src/lib/prisma.ts`
Instantiates the Prisma Client. Under Prisma 7, connection engines are decoupled. This file loads the standard PostgreSQL Node driver (`pg`), instantiates a connection Pool, binds it to the `@prisma/adapter-pg` driver-adapter, and instantiates the client singleton (preventing database connection leaks during development hot-reloading).

---

## ⚙️ 3. Backend Controllers: Server Actions (`src/app/actions.ts`)

This file contains all the database CRUD operations marked with Next.js's `"use server"` directive:

- **Tracks & Subtopics**:
  - `getTracks()`: Fetches all tracks and their subtopics.
  - `createTrack()`, `deleteTrack()`: Track management.
  - `createSubtopic()`, `deleteSubtopic()`: Checklist item management.
  - `toggleSubtopicStatus()`: Toggles a checklist status (`NOT_STARTED`, `IN_PROGRESS`, `DONE`).
- **Series**:
  - `getSeries()`: Fetches collections with log counts.
  - `getSeriesWithEntries()`: Retrieves a series' entries ordered by `seriesDay` or date.
  - `createSeries()`, `deleteSeries()`: Collection management.
- **Daily Entries**:
  - `getEntries()`: Fetches feed entries with optional filters (track, series, tag).
  - `getEntryById()`, `getEntryByDate()`: Entry detail query helpers.
  - `createEntry()`, `updateEntry()`: Saves daily logs. Handles the side-effect of automatically marking linked subtopics as `DONE` and sets `completedAt` to the entry's date.
  - `deleteEntry()`: Deletes log entries.
- **Analytics & Calculations**:
  - `getDashboardStats()`: Computes total logs, percentage-based checklists completion, and parses entry dates to calculate your **current daily log streak** (checks consecutive daily entries starting from today or yesterday).
  - `getHeatmapData()`: Fetches count of entries logged in the past year grouped by date (`{ [dateString]: count }`).

---

## 🖥️ 4. Front-End Pages & Views

### 📄 Dashboard (`src/app/page.tsx`)
The landing dashboard that queries database stats at runtime. It displays:
- Highlights cards: current streak count, total logged entries, overall skill checklist progress.
- Heatmap calendar showing logs written over the past 365 days.
- Lists showing track completion ratios and your most recent 5 entries.

### 📄 Tracks Checklist (`src/app/tracks/page.tsx` & `TracksClient.tsx`)
A checklists dashboard. You can create/delete tracks, add items to each track, and select status from a dropdown (`Not Started`, `In Progress`, `Completed`) which immediately triggers DB sync.

### 📄 Series Page (`src/app/series/page.tsx`, `SeriesClient.tsx` & `[id]/page.tsx`)
Allows organizing entries under specific themes:
- The `/series` dashboard provides forms to create log collections (e.g. "Placement prep by 2026") and lists active collections with entry counts.
- The `/series/[id]` detail view renders logged days sequentially (e.g., Day 1, Day 2, Day 3) in a clean editorial timeline layout.

### 📄 Daily Feed (`src/app/feed/page.tsx` & `FeedFilters.tsx`)
A scrollable, clean blog index of all daily logs. It incorporates the client-side `FeedFilters` component which lets you filter logs by Track, Series, or tags.

### 📄 Calendar Log (`src/app/calendar/page.tsx`)
A side-by-side split screen browse page:
- On the left: Displays a monthly calendar grid. Days that contain entries are highlighted with a subtle dot, and the selected day has a dark outline.
- On the right: Displays the full contents of the selected day's entry: title, series day, rendered markdown body, completed checklists (e.g. `"✅ Completed DP — via Placement Prep, Day 47"`), and tags. If no log exists, it displays a button prompting you to write one for that day.

### 📄 Log Editor (`src/app/new/page.tsx` & `EntryForm.tsx`)
A split editor interface.
- Left fields: Input for Title and a monospace textarea supporting Markdown.
- Right fields: Date selector, Series link, Series Day, general text tags (separated by commas), and a list of checklist subtopics. You can check off subtopics you worked on that day, which links them to the entry and marks them as completed.

---

## 🎨 5. Shared UI & Layout Helpers

- **`src/app/layout.tsx`**: Defines the typography-first layout. Imports Google Fonts (`Inter` for UI sans-serif text, and `Lora` for editorial serif text) and implements a clean, border-delimited navigation header.
- **`src/components/Heatmap.tsx`**: Renders the GitHub-style 365-day grid. Aligns columns to Sunday-to-Saturday weeks.
- **`src/components/MonthlyCalendar.tsx`**: Client component grid allowing users to click dates to load log details.
- **`src/components/Markdown.tsx`**: Converts markdown text into structured typography.
- **`src/components/DeleteEntryForm.tsx`**: Client component wrapper that prompts a browser confirmation popup before invoking the log delete action.
