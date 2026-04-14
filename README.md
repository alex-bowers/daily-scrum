# Daily Scrum

A collaborative team dashboard for managing daily standups, tracking GitHub pull requests, and syncing work items in real-time.

[![Image from Gyazo](https://i.gyazo.com/0f49a92ce31659cf2a828191b5528446.png)](https://gyazo.com/0f49a92ce31659cf2a828191b5528446)

## Features

- **Real-time synchronization** — WebSocket-powered live updates across all team members
- **GitHub integration** — Automatically fetch and display team member PRs and contributions
- **Dark/Light theme** — Respects system preference with manual override
- **Daily todo tracking** — Team members can log daily tasks and mark them as complete
- **Responsive design** — Works seamlessly on desktop and mobile devices

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- A **GitHub personal access token** (for fetching PR data)
- Basic familiarity with Vue.js, Express.js, and SQLite

## Installation

### 1. Clone and install dependencies

```bash
# Clone the repository
git clone <repository-url>
cd daily-scrum

# Install root dependencies (includes concurrently for running dev servers)
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

### 2. Configure environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with the following variables:

| Variable         | Description                       | Example             |
| ---------------- | --------------------------------- | ------------------- |
| `GITHUB_TOKEN`   | Your GitHub personal access token | `ghp_xxxxxxxxxxxx`  |
| `GITHUB_ORG`     | GitHub organization name          | `my-team-org`       |
| `TEAM_USERNAMES` | Comma-separated GitHub usernames  | `alice,bob,charlie` |
| `SERVER_PORT`    | Backend server port               | `3000`              |

**How to create a GitHub token:**

1. Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `public_repo` scope
3. Copy the token and paste it into `.env`

### 3. Start the development server

```bash
npm run dev
```

This will concurrently start:

- **Frontend** (Vite dev server): Available at the URL shown in your terminal (typically `http://localhost:5173`)
- **Backend** (Express): Running on the port specified in `.env` (default: `http://localhost:3000`)

The frontend is configured to proxy API requests to the backend automatically.

## Running the Application

### Development mode

```bash
npm run dev
```

### Development with individual servers

If you prefer to run servers separately:

```bash
npm run dev:server  # Terminal 1
npm run dev:client  # Terminal 2
```

### Production build

```bash
# Build frontend
npm run build --prefix client

# Serve static files from the backend
# (The server is configured to serve the `client/dist` folder)
npm start --prefix server
```

## Contributing

We welcome contributions! Here's how to get involved:

### Reporting bugs

1. Check [existing issues](../../issues) to avoid duplicates
2. Open a [new issue](../../issues/new/choose) and use the **Bug Report** template
3. Include reproduction steps, screenshots, and environment details

### Suggesting features

1. Open a [new issue](../../issues/new/choose) and use the **Feature Request** template
2. Describe the use case and proposed solution clearly

### Submitting code changes

1. Fork the repository and create a feature branch: `git checkout -b feature/your-featureure-name`
2. Make your changes and test thoroughly
3. Commit with clear messages: `git commit -m "feature: add new featureure"`
4. Push to your fork: `git push origin feature/your-featureure-name`
5. Open a [Pull Request](../../pull/new) and use the **PR template**
6. Address any review feedback and ensure CI checks pass

### Development guidelines

- **Code style**: Follow existing code conventions
- **Vue components**: Use `<script setup>` syntax
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) format

## Troubleshooting

### Port already in use

If port 3000 is already in use, specify a different port:

```bash
SERVER_PORT=3001 npm run dev
```

### GitHub token issues

- Ensure your token has `public_repo` scope
- Check that the token hasn't expired
- Verify the `GITHUB_ORG` name matches your GitHub organization exactly

### WebSocket connection errors

- Check that the backend server is running on the correct port
- Verify the Vite proxy config in `client/vite.config.js` matches your backend port
- Clear browser cache and refresh the page

### Database issues

If you encounter database corruption, delete the data file and restart:

```bash
rm data/scrum.db && npm run dev
```

## Support

For questions or issues, please open a [GitHub issue](../../issues) or reach out to the team.
