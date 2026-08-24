# Najd Schools Attendance

Bilingual Arabic/English attendance management web app for Najd Schools.

## Features

- Arabic RTL and English LTR interfaces
- National and International programs
- Multiple academic years with two semesters per year
- Role, program, grade, and section permissions
- Bilingual class and section names
- Persistent Neon Auth sessions
- Neon Postgres database and row-level security
- Vercel-ready Vite build

Student records and credentials are stored in Neon and are not committed to this repository.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Vercel deployment

The repository includes `vercel.json`, so Vercel uses the reproducible
`npm ci` install, runs the Vite production build, and publishes `dist`.

After importing this repository into Vercel, pushes to the production branch
deploy automatically. An authenticated CLI environment can also deploy the
current checkout with:

```bash
vercel --prod
```

## Mobile rendering check

Run the repository's dependency-free responsive-layout check:

```bash
npm run check:mobile
```

The check validates the viewport configuration, mobile breakpoints, short-screen
login behavior, safe-area handling, form stacking, and table overflow without
downloading a browser at test time.
