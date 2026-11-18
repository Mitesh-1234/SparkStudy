# StudySpark — Learn it your way
MERN college prototype upgrade. Plan / Focus / Play / Create / Progress.

## Windows setup (VS Code)
1. Install Node.js 22 LTS (nodejs.org) and MongoDB Community Server (mongodb.com/try/download/community). During MongoDB setup choose Run as a Windows Service. Alternatively use MongoDB Atlas and a connection string with your own database credentials.
2. Extract ZIP, open the StudySpark folder in VS Code (File > Open Folder). Open Terminal > New Terminal.
3. Run `npm install` from the folder containing package.json.
4. In VS Code copy `server/.env.example` to `server/.env` (exact filename). Replace JWT_SECRET with a random secret of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Set MONGO_URI if using Atlas. Never share .env.
5. Run `npm run dev`. Open http://localhost:5173 in Chrome or Edge. Register an account. Keep terminal open. If MongoDB connection fails, check Windows Services for MongoDB or Atlas connection details.
6. For a production build: `npm run build`, then `npm start`, open http://localhost:5000. Use HTTPS if deployed remotely.

## Demo checklist
- Register and sign in. Add a DBMS exam task and a DSA revision task, adjust deadline and daily minutes. Complete a task and observe schedule recalculation.
- Open Focus Guard, click Start camera session; allow browser camera permission. Wait for models to load (internet needed). Sit in good lighting, face camera, turn sideways for several seconds, leave frame, then hold a phone visibly. Detection is approximate. Stop & save. Manual timer is available if models or camera fail; it records no camera observations. Close other camera apps. Leaving Focus Guard stops camera and discards unsaved session.
- Battle Arena: choose DSA or DBMS, answer five timed questions, read feedback and view actual database rankings. Register a second account to show shared ranking. This is solo competition, not real-time friend rooms.
- Create Lab: generate a revision template and save notes. Analytics: view completion, study minutes, quiz scores and session history. Recent 200 sessions/games are shown and used in reports.

## PPT alignment / limitations
Slides 4–6: replace old screenshots with screenshots from running app after testing. Slide 8: retain earlier survey/test figures only as results for the earlier prototype if genuinely collected; do not claim the new version achieved them. Repeat the three practical user tasks on this version. Slide 10: accounts, database and actual leaderboard are implemented. The scheduler is a deadline-first heuristic. Focus Guard uses local webcam models for approximate distraction indicators; it is not concentration measurement. No video is saved or uploaded; only summary session metrics are sent. Model assets download from third parties. Passwords are bcrypt-hashed and sessions use short-lived HTTP-only cookies. Helmet, rate limiting, Zod validation, MongoDB sanitization, and origin checks are enabled. Email verification and password recovery remain future work. Use test accounts and no sensitive data.

## Verification
Server JavaScript syntax checked. Dependencies, browser build, database, webcam and model downloads require testing on your computer; not verified end-to-end in the creation environment.

## Hosting with Vercel and Render
1. Push the project to a Git provider.
2. Create a MongoDB Atlas database and copy its connection string.
3. Create a Render Web Service from the repository. The included `render.yaml` uses `npm install && npm run build` and `npm start`.
4. Set these Render variables:
   - `MONGO_URI`: your MongoDB Atlas connection string
   - `JWT_SECRET`: a new random value with at least 32 characters
   - `APP_ORIGIN`: your Vercel URL, for example `https://studyspark.vercel.app`
   - `NODE_ENV`: `production`
5. In Vercel, import the same repository and set the project root directory to `client`.
6. Set the Vercel variable `VITE_API_URL` to the Render service URL, for example `https://studyspark-api.onrender.com`.
7. Deploy Vercel after setting the variable. The frontend uses secure cross-site cookies and the backend only accepts the configured Vercel origin.

Do not commit either `.env` file. Use the example files only as variable-name references.
