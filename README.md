# 🕌 Al Kawser — Islamic Learning Management System

> A premium, production-ready LMS for Islamic education powered by YouTube playlists,
> built with React + Vite, Supabase, and Tailwind CSS.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Auth** | Supabase Auth (email/password), role-based (admin/student) |
| **Course Import** | Paste a YouTube playlist URL → auto-fetch all video titles, thumbnails, IDs |
| **Video Player** | Embedded YouTube iframe — no downloads, bandwidth-friendly |
| **Progress Tracking** | Per-lesson completion, per-course % progress bar |
| **Resume Learning** | Picks up from last unwatched lesson automatically |
| **Daily Streaks** | Tracks consecutive days of learning |
| **Certificates** | Auto-generate PNG certificate on 100% course completion |
| **Notes** | Per-lesson notes saved to Supabase |
| **Bookmarks** | Bookmark any lesson; view all bookmarks in one place |
| **Admin Dashboard** | Create/edit/delete courses, manage users, view analytics |
| **RLS Security** | Supabase Row Level Security on every table |
| **Mobile Responsive** | Collapsible sidebar, fluid layouts |

---

## 🗂 Folder Structure

```
al-kawser/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── auth/         # ProtectedRoute, AdminRoute, GuestRoute
│   │   ├── admin/        # PlaylistImporter
│   │   ├── course/       # CourseCard, LessonItem, VideoPlayer
│   │   ├── layout/       # Layout, Sidebar, Navbar
│   │   └── ui/           # Button, Input, Modal, ProgressBar, etc.
│   ├── lib/
│   │   └── supabase.js   # Supabase client
│   ├── pages/
│   │   ├── auth/         # Login, Register
│   │   ├── admin/        # AdminDashboard, AdminCourses, CreateCourse, AdminUsers, AdminAnalytics
│   │   └── student/      # StudentDashboard, CourseCatalog, CourseDetail, CoursePlayer,
│   │                     #   Certificates, Bookmarks
│   ├── services/
│   │   ├── courseService.js      # Course/module/lesson/enrollment CRUD
│   │   ├── progressService.js    # Progress, certificates, notes, bookmarks
│   │   ├── youtubeService.js     # Playlist fetch, embed URL helpers
│   │   └── certificateService.js # PNG certificate generator
│   ├── store/
│   │   └── authStore.js  # Zustand store for auth state
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── schema.sql        # Complete DB schema + RLS policies
├── .env.example
├── vercel.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/al-kawser.git
cd al-kawser
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name (e.g. `al-kawser`), set a strong database password
3. Wait for it to provision (~1 min)

### 3. Run the Database Schema

1. In your Supabase dashboard → **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**

### 4. Create Storage Buckets

In Supabase dashboard → **Storage** → **New Bucket** (create these 3):

| Bucket Name | Public |
|---|---|
| `thumbnails` | ✅ Yes |
| `certificates` | ✅ Yes |
| `avatars` | ✅ Yes |

### 5. Get a YouTube Data API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → **Enable APIs** → search for **YouTube Data API v3** → Enable
3. **Credentials** → **Create Credentials** → **API Key**
4. (Optional but recommended) Restrict the key to YouTube Data API v3 + your domain

### 6. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
VITE_YOUTUBE_API_KEY=AIzaSy...
VITE_APP_URL=http://localhost:3000
```

> Find `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in:
> Supabase Dashboard → **Settings** → **API**

### 7. Run Locally

```bash
npm run dev
```

App runs at `http://localhost:3000`

### 8. Create Your First Admin

1. Register an account normally via the app
2. In Supabase → **SQL Editor**, run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

3. Sign out and sign back in — you'll now see the Admin panel

---

## 📦 Deployment to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B — GitHub Integration (Recommended)

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Framework: **Vite** (auto-detected)
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_YOUTUBE_API_KEY`
   - `VITE_APP_URL` (your Vercel URL)
5. Click **Deploy**

> The `vercel.json` is already configured for SPA routing.

### Configure Supabase Auth Redirect URLs

In Supabase → **Authentication** → **URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

---

## 🎓 How to Use

### As Admin

1. Sign in with your admin account
2. Go to **Admin → New Course**
3. Paste a YouTube playlist URL → click **Fetch**
4. Review & edit the course title, description, category, level
5. Toggle **Published** to make it visible to students
6. Save → course is live!

### As Student

1. Register or sign in
2. Browse **Courses** → click any course
3. **Enroll** → start watching lessons
4. Click **Mark Done** after each lesson
5. Track progress in **Dashboard**
6. Download your **Certificate** when you reach 100%

---

## 🗄 Database Schema Overview

```
profiles      — extends auth.users (name, role, streak, last_active)
courses       — title, description, thumbnail, category, level, language, is_published
modules       — belongs to course (title, order)
lessons       — belongs to module (youtube_id, title, thumbnail_url, order)
enrollments   — user ↔ course junction
progress      — per-lesson completion + watched seconds
certificates  — issued on 100% completion, unique per user+course
lesson_notes  — one note per user per lesson
bookmarks     — user ↔ lesson junction
```

---

## 🔐 Security

- All tables protected by **Row Level Security (RLS)**
- Students can only read/write their own progress, notes, bookmarks
- Only admins can create/edit/delete courses, modules, lessons
- `is_admin()` SQL function used across all admin policies
- YouTube videos served via embed only — no download possible

---

## 🔧 Customization

### Add a new course category
Edit `CATS` array in `CourseCatalog.jsx` and `CreateCourse.jsx`.

### Change color theme
Edit `tailwind.config.js` → update `colors.green` / `colors.gold`.

### Add payment integration
The schema includes `is_free` and `price` columns. Hook up Stripe or Paddle in `enrollInCourse()` inside `courseService.js`.

### Enable email confirmation
In Supabase → **Authentication** → **Email** → toggle **Confirm email**.

---

## 📋 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| State | Zustand |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Video | YouTube Embedded IFrame API |
| Fonts | Cinzel (display), Nunito (body), Amiri (Arabic) |
| Icons | Lucide React |
| Toasts | React Hot Toast |
| Certificates | html2canvas |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## 🤲 Built with love for the Ummah

*"وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا"*

May Allah accept this effort and make it a source of benefit for the Muslim community. Ameen.

---

© 2025 Al Kawser Islamic Learning Platform
