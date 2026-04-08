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

3. **Start the dev server:**
   ```bash
   npm run dev
   ```
   The client will be available at the URL shown by Vite, and the API server will run on the configured `SERVER_PORT`.
