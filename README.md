# Najd Schools Attendance & Behavior Platform

Bilingual Arabic/English student attendance and behavior platform for Najd Schools.

## Features

- Arabic RTL and English LTR interfaces
- National and International programs
- Multiple academic years with two semesters per year
- Role, program, grade, and section permissions
- Bilingual class and section names
- Persistent Neon Auth sessions
- Neon Postgres database and row-level security
- One post-login launcher for Attendance and Behavior
- Shared users, students, classes, academic context, and permission scopes
- Behavioral violations, official interventions, positive behavior, reports, and audit history
- Vercel-ready Vite build

Student records, behavior records, and credentials are stored in Neon and are not committed to this repository. Attendance and Behavior data share the same `school_state` record; each academic year contains two independent semester records.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```
