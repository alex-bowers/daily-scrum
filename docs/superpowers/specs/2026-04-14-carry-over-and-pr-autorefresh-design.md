# Design: Carry Over Todos & PR Auto-refresh

**Date:** 2026-04-14  
**Features:** Option A — Carry Over Incomplete Todos, Option C — Auto-refresh PR Counts

---

## Feature A: Carry Over Incomplete Todos

### Goal

Allow a team member to copy incomplete todos from their last active working day into today's list with a single button click. Avoids manual re-entry after weekends or days off.

### Behaviour

- The "Carry over" button appears only when viewing today's date (same visibility guard as the add-todo form).
- Clicking it calls a new server endpoint which finds the most recent date *before* today that has at least one todo for that user, then copies all incomplete (`completed = 0`) rows into today.
- Copied todos are appended after any todos that already exist today (`sort_order` starts after the current maximum).
- Each new todo is broadcast via the existing `todo:added` WebSocket event — all connected clients update live without a page reload.
- If no previous day with todos exists, or all previous todos were already complete, the endpoint returns an empty array and nothing changes in the UI.

### Server

**New endpoint:** `POST /api/todos/carry-over`

Request body:
```json
{ "username": "MattX23", "toDate": "2026-04-14" }
```

Response: array of newly created todo objects (same shape as existing todo rows).

Logic:
1. Query for the most recent `date < toDate` where `username = ?` and at least one row exists.
2. Select all rows from that date where `completed = 0`.
3. Find `MAX(sort_order)` for `(username, toDate)` — default to `-1` if none.
4. Insert each incomplete todo into `(username, toDate, text, completed=0, sort_order)` incrementing from `max + 1`.
5. Broadcast each inserted row via `todo:added`.
6. Return the inserted rows as JSON.

### Client

- `useTodos.js`: new `carryOver(toDate)` async function — `POST /api/todos/carry-over` with `{ username, toDate }`.
- `TodoList.vue`: "Carry over" button rendered alongside the add form (i.e. only when `!isPast`). Calls `carryOver(selectedDate)`.

---

## Feature C: Auto-refresh PR Counts

### Goal

PR review counts refresh automatically on a configurable interval so the board stays current without manual clicks during a standup.

### Behaviour

- On mount, after the initial `fetchPrs()` call, a `setInterval` starts using the configured interval.
- The interval is cleaned up via `onUnmounted` to avoid memory leaks.
- A `lastUpdated` timestamp (stored as a `ref`) is set after each successful fetch and displayed as `Last updated: HH:MM` beside the Refresh button.
- The server's existing 10-minute cache means requests within that window return instantly — no extra GitHub API calls are made.

### Configuration

`.env` and `.env.example` gain a new variable:

```
VITE_PR_REFRESH_INTERVAL=5
```

Value is in **minutes**. Vite exposes all `VITE_*` variables to the client via `import.meta.env` — no server changes required.

If the variable is absent or unparseable, the interval defaults to `5` minutes.

### Client (`App.vue`)

- Read `import.meta.env.VITE_PR_REFRESH_INTERVAL`, parse to integer, fall back to `5`.
- Convert to milliseconds for `setInterval`.
- New `lastUpdated` ref — set to `new Date()` at the end of a successful `fetchPrs()`.
- Display formatted as `HH:MM` (locale time) next to the Refresh button.
- Register `onUnmounted` cleanup to clear the interval.

---

## Out of Scope

- Carry over does not support bulk-selecting which items to copy — all incomplete items are carried over.
- PR auto-refresh interval is not validated against the server cache TTL — sub-10-minute intervals are valid and will simply hit the cache.
- No UI notification when carry over finds nothing to copy.
