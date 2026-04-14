# Daily Scrum

[![Image from Gyazo](https://i.gyazo.com/0f49a92ce31659cf2a828191b5528446.png)](https://gyazo.com/0f49a92ce31659cf2a828191b5528446)

## Setup

1. **Clone the repo** and install dependencies:
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

2. **Configure environment variables** — copy the example file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   - `GITHUB_TOKEN` — a GitHub personal access token
   - `GITHUB_ORG` — your GitHub organisation name
   - `TEAM_USERNAMES` — comma-separated list of team member GitHub usernames
   - `SERVER_PORT` — port for the API server (default: `3000`)
   - `VITE_PR_REFRESH_INTERVAL` — how often (in minutes) PR counts auto-refresh in the browser (default: `5`)

3. **Start the dev server:**
   ```bash
   npm run dev
   ```
   The client will be available at the URL shown by Vite, and the API server will run on the configured `SERVER_PORT`.

## Features

### Carry over incomplete todos

Each team member's card shows a **Carry over from last active day** button when viewing today's date. Clicking it copies all incomplete todos from the most recent day that user had todos (skipping weekends or days off) into today's list, appending after any existing items. The update is broadcast in real time to all connected browsers.

### PR count auto-refresh

Open PR review counts refresh automatically in the background on the interval set by `VITE_PR_REFRESH_INTERVAL`. A **Updated HH:MM** timestamp beside the Refresh button shows when counts were last fetched.
