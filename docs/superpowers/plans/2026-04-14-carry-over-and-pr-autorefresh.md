# Carry Over Todos & PR Auto-refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Carry over" button that copies incomplete todos from the last active day into today, and auto-refresh PR counts on a configurable interval.

**Architecture:** Feature A adds a single new server endpoint (`POST /api/todos/carry-over`) and a matching composable function + button on the client. Feature C is entirely client-side — a `setInterval` in `App.vue` driven by a `VITE_*` env var. The two features are independent and can be implemented in sequence.

**Tech Stack:** Node.js / Express / better-sqlite3 (server), Vue 3 Composition API / Vite (client)

---

## Files

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `server/src/routes/todos.js` | Add `POST /carry-over` endpoint |
| Modify | `client/src/composables/useTodos.js` | Add `carryOver()` function |
| Modify | `client/src/components/TodoList.vue` | Add Carry over button |
| Modify | `client/src/App.vue` | Add auto-refresh interval + lastUpdated display |
| Modify | `.env` | Add `VITE_PR_REFRESH_INTERVAL` |
| Modify | `.env.example` | Add `VITE_PR_REFRESH_INTERVAL` |
| Modify | `README.md` | Document new features |

---

## Task 1: Create feature branch

**Files:** none

- [ ] **Create and switch to the feature branch**

```bash
git checkout -b feature/carry-over-and-pr-autorefresh
```

Expected: `Switched to a new branch 'feature/carry-over-and-pr-autorefresh'`

---

## Task 2: Add carry-over endpoint to the server

**Files:**
- Modify: `server/src/routes/todos.js`

- [ ] **Add the `POST /carry-over` route**

Open `server/src/routes/todos.js`. Add the following block **before** the `router.patch('/:id', ...)` route (placing it before any parameterised routes avoids any accidental match):

```js
router.post('/carry-over', (req, res) => {
    const { username, toDate } = req.body
    if (!username || !toDate) {
        return res.status(400).json({ error: 'username and toDate are required' })
    }

    const db = getDb()

    // Most recent day before toDate that has at least one todo for this user
    const sourceDay = db
        .prepare('SELECT DISTINCT date FROM todos WHERE username = ? AND date < ? ORDER BY date DESC LIMIT 1')
        .get(username, toDate)

    if (!sourceDay) {
        return res.json([])
    }

    // All incomplete todos from that day, in display order
    const incompleteTodos = db
        .prepare('SELECT * FROM todos WHERE username = ? AND date = ? AND completed = 0 ORDER BY sort_order ASC, id ASC')
        .all(username, sourceDay.date)

    if (incompleteTodos.length === 0) {
        return res.json([])
    }

    // Append after any todos that already exist for toDate
    const { m: maxOrder } = db
        .prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM todos WHERE username = ? AND date = ?')
        .get(username, toDate)

    const insertStmt = db.prepare(
        'INSERT INTO todos (username, date, text, completed, sort_order) VALUES (?, ?, ?, 0, ?)'
    )
    const selectStmt = db.prepare('SELECT * FROM todos WHERE id = ?')

    const newTodos = []
    db.transaction(() => {
        incompleteTodos.forEach((todo, i) => {
            const info = insertStmt.run(username, toDate, todo.text, maxOrder + 1 + i)
            newTodos.push(selectStmt.get(info.lastInsertRowid))
        })
    })()

    newTodos.forEach((todo) => broadcast('todo:added', todo))
    res.status(201).json(newTodos)
})
```

- [ ] **Manually verify the endpoint**

With the server running (`npm run dev` from the project root), run:

```bash
curl -s -X POST http://localhost:3002/api/todos/carry-over \
  -H "Content-Type: application/json" \
  -d '{"username":"MattX23","toDate":"2099-01-01"}' | cat
```

Expected: `[]` (no todos exist for that user before that date, so nothing to copy — confirms the endpoint returns cleanly when there's nothing to carry over).

- [ ] **Commit**

```bash
git add server/src/routes/todos.js
git commit -m "feat: add POST /api/todos/carry-over endpoint"
```

---

## Task 3: Add `carryOver()` to the `useTodos` composable

**Files:**
- Modify: `client/src/composables/useTodos.js`

- [ ] **Add the function inside `useTodos`**

Open `client/src/composables/useTodos.js`. Add the following function after `reorderTodos`:

```js
async function carryOver(toDate) {
    const res = await fetch('/api/todos/carry-over', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, toDate }),
    })
    if (!res.ok) throw new Error('Failed to carry over todos')
    return res.json()
}
```

- [ ] **Export it from the return object**

Find the `return {` block at the bottom of `useTodos` and add `carryOver` to it:

```js
return {
    todos,
    loading,
    fetchTodos,
    addTodo,
    updateTodo,
    removeTodo,
    reorderTodos,
    carryOver,
    handleAdded,
    handleUpdated,
    handleDeleted,
    handleReordered,
}
```

- [ ] **Commit**

```bash
git add client/src/composables/useTodos.js
git commit -m "feat: add carryOver() to useTodos composable"
```

---

## Task 4: Add the Carry over button to `TodoList.vue`

**Files:**
- Modify: `client/src/components/TodoList.vue`

- [ ] **Destructure `carryOver` from the composable**

In the `<script setup>` block, find the line that destructures `useTodos`. Update it to include `carryOver`:

```js
const { todos, loading, fetchTodos, addTodo, updateTodo, removeTodo, reorderTodos, carryOver, handleAdded, handleUpdated, handleDeleted, handleReordered } =
    useTodos(props.username)
```

- [ ] **Add the handler function**

After the `submitAdd` function, add:

```js
async function submitCarryOver() {
    await carryOver(selectedDate.value)
}
```

- [ ] **Add the button to the template**

Find the `<form v-if="!isPast" ...>` block. Add the carry-over button **above** the form so it sits at the top of the input area:

```html
<button
    v-if="!isPast"
    type="button"
    class="todo-list__carry-btn"
    @click="submitCarryOver"
>
    Carry over from last active day
</button>

<form v-if="!isPast" class="todo-list__form" @submit.prevent="submitAdd">
```

- [ ] **Verify in the browser**

Open `http://localhost:5173`. Each team member card should show a "Carry over from last active day" button above the add-todo input when viewing today. Clicking it should copy that user's incomplete todos from their last day with todos into today's list, visible immediately across all open browser tabs (WebSocket broadcast).

- [ ] **Commit**

```bash
git add client/src/components/TodoList.vue
git commit -m "feat: add carry-over button to TodoList"
```

---

## Task 5: Add `VITE_PR_REFRESH_INTERVAL` to env files

**Files:**
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Add to `.env`**

Append to `.env`:

```
VITE_PR_REFRESH_INTERVAL=5
```

- [ ] **Add to `.env.example`**

Append to `.env.example`:

```
VITE_PR_REFRESH_INTERVAL=5
```

- [ ] **Commit**

```bash
git add .env.example
git commit -m "feat: add VITE_PR_REFRESH_INTERVAL env var"
```

Note: `.env` is gitignored — do not stage it.

---

## Task 6: Add auto-refresh and last-updated display to `App.vue`

**Files:**
- Modify: `client/src/App.vue`

- [ ] **Update the Vue import to include `onUnmounted` and `computed`**

Find the existing import at the top of `<script setup>`:

```js
import { ref, reactive, onMounted } from 'vue'
```

Replace with:

```js
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
```

- [ ] **Add `lastUpdated` ref and `lastUpdatedLabel` computed**

After the `prLoading` ref declaration, add:

```js
const lastUpdated = ref(null)
let refreshTimer = null

const lastUpdatedLabel = computed(() => {
    if (!lastUpdated.value) return null
    return lastUpdated.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
```

- [ ] **Set `lastUpdated` inside `fetchPrs` on success**

Find the existing `fetchPrs` function and update it so `lastUpdated` is set after a successful fetch:

```js
async function fetchPrs() {
    prLoading.value = true
    try {
        const res = await fetch('/api/github/prs')
        prCounts.value = await res.json()
        lastUpdated.value = new Date()
    } catch (e) {
        console.error('Failed to fetch PR counts:', e)
    } finally {
        prLoading.value = false
    }
}
```

- [ ] **Start the interval in `onMounted` and clean up in `onUnmounted`**

Replace the existing `onMounted` block with:

```js
onMounted(async () => {
    await fetchTeam()
    await fetchPrs()
    const intervalMinutes = parseInt(import.meta.env.VITE_PR_REFRESH_INTERVAL, 10) || 5
    refreshTimer = setInterval(fetchPrs, intervalMinutes * 60 * 1000)
})

onUnmounted(() => {
    clearInterval(refreshTimer)
})
```

- [ ] **Add the last-updated label to the template**

Find the Refresh PRs button in the template:

```html
<button class="app__refresh-btn" :disabled="prLoading" :aria-busy="prLoading" @click="fetchPrs">
    {{ prLoading ? 'Refreshing…' : 'Refresh PRs' }}
</button>
```

Replace with:

```html
<span v-if="lastUpdatedLabel" class="app__last-updated" aria-live="polite">
    Updated {{ lastUpdatedLabel }}
</span>
<button class="app__refresh-btn" :disabled="prLoading" :aria-busy="prLoading" @click="fetchPrs">
    {{ prLoading ? 'Refreshing…' : 'Refresh PRs' }}
</button>
```

- [ ] **Verify in the browser**

Open `http://localhost:5173`. After load, the header should show "Updated HH:MM" beside the Refresh button. Every 5 minutes the counts will silently refresh and the timestamp will update.

- [ ] **Commit**

```bash
git add client/src/App.vue
git commit -m "feat: auto-refresh PR counts with configurable interval and last-updated display"
```

---

## Task 7: Update README

**Files:**
- Modify: `README.md`

- [ ] **Replace `README.md` with the following content**

```markdown
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
```

- [ ] **Commit**

```bash
git add README.md
git commit -m "docs: document carry-over and PR auto-refresh features"
```

---

## Task 8: Push branch and open PR

**Files:** none

- [ ] **Push the branch**

```bash
git push -u origin feature/carry-over-and-pr-autorefresh
```

- [ ] **Open a PR against the upstream repo**

```bash
gh pr create \
  --title "feat: carry over incomplete todos and auto-refresh PR counts" \
  --body "$(cat <<'EOF'
## Summary

- Adds a **Carry over** button to each team member's card that copies incomplete todos from their last active working day into today's list, appending after any existing todos. Updates are broadcast via WebSocket so all connected clients reflect the change immediately.
- Adds **PR count auto-refresh** on a configurable interval (`VITE_PR_REFRESH_INTERVAL` env var, default 5 minutes). A "Updated HH:MM" timestamp is shown beside the Refresh button after each successful fetch.

## Test plan

- [ ] Click "Carry over" on a card that has incomplete todos from a previous day — items appear in today's list across all open tabs
- [ ] Click "Carry over" on a card with no previous todos — nothing happens, no error
- [ ] Click "Carry over" when all previous todos are already complete — nothing happens
- [ ] "Carry over" button is hidden when viewing a past date
- [ ] "Updated HH:MM" label appears in the header after page load
- [ ] PR counts refresh automatically after the configured interval
- [ ] Setting `VITE_PR_REFRESH_INTERVAL=1` in `.env` and waiting ~1 minute confirms the label updates

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

