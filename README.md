# CampusTask Manager

A task management web app designed for students to organize coursework by subject, track due dates, and stay on top of deadlines.

**Live Demo:** https://campus-task-manager.vercel.app

---

## Features

- **Authentication** — Secure email/password sign up and login via Supabase Auth
- **Subject Management** — Create, edit, and delete color-coded subjects
- **Task System** — Full task CRUD with subject linking, due dates, priority levels, and completion toggle
- **Smart Sorting** — Tasks sorted by overdue → due date → priority automatically
- **Filters** — Filter tasks by subject and status (active, completed, overdue)
- **Dashboard** — Live stat cards, recent tasks, and subject progress bars
- **Calendar View** — Monthly calendar with tasks plotted on due dates
- **Browser Notifications** — Alerts for overdue and due-today tasks on load
- **Responsive Design** — Works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Auth) |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account

### 1. Clone the repository
```bash
git clone https://github.com/GeraldHo06/campus-task-manager.git
cd campus-task-manager
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase

Create a new project at [supabase.com](https://supabase.com), then run this SQL in the SQL Editor:

```sql
create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  completed boolean default false,
  created_at timestamptz default now()
);

alter table subjects enable row level security;
alter table tasks enable row level security;

create policy "Users see own subjects" on subjects for all using (auth.uid() = user_id);
create policy "Users see own tasks" on tasks for all using (auth.uid() = user_id);
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Run the app
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx      # Navigation sidebar with mobile support
│   │   └── TopBar.tsx       # Top header with user info
│   └── ProtectedRoute.tsx   # Auth guard for private routes
├── hooks/
│   ├── useAuth.ts           # Auth state management
│   └── useNotifications.ts  # Browser notification logic
├── lib/
│   └── supabaseClient.ts    # Supabase client initialization
├── pages/
│   ├── Login.tsx            # Sign in / sign up page
│   ├── Dashboard.tsx        # Overview with stats and recent tasks
│   ├── Subjects.tsx         # Subject management
│   ├── Tasks.tsx            # Task management with filters
│   └── Calendar.tsx         # Monthly calendar view
└── types/
    └── index.ts             # Shared TypeScript types
```

---

## Database Schema

```
users          → managed by Supabase Auth
subjects       → id, user_id, name, color, created_at
tasks          → id, user_id, subject_id, title, description, due_date, priority, completed, created_at
```

Row Level Security ensures users can only access their own data.

---

## Author

Gerald Ho — [github.com/GeraldHo06](https://github.com/GeraldHo06)