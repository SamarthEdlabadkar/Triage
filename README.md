# SMART@Home

Next.js application for the SMART@Home clinician data-view challenge.

## Local development

Install dependencies, copy `.env.example` to `.env.local`, and set `MONGODB_URI` to your MongoDB connection string. Then seed the synthetic dataset and start the development server:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm start` serves the production build.
- `npm run lint` checks the code with ESLint.
- `npm run typecheck` checks TypeScript types.
- `npm run seed` loads the synthetic dataset into MongoDB. The app reads it from MongoDB at request time.
