<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useWebSocket } from './composables/useWebSocket.js';
import TeamMemberCard from './components/TeamMemberCard.vue';
import { useTheme } from './composables/useTheme.js';

const { resolvedDark, preference, toggle: toggleTheme, resetToSystem } = useTheme();

const team = ref([]);
const org = ref('');
const prCounts = ref({});
const prLoading = ref(false);

const wsHandlers = reactive({
  'todo:added': [],
  'todo:updated': [],
  'todo:deleted': [],
  'todo:reordered': [],
});

useWebSocket({
  'todo:added': (payload) => wsHandlers['todo:added'].forEach((fn) => fn(payload)),
  'todo:updated': (payload) => wsHandlers['todo:updated'].forEach((fn) => fn(payload)),
  'todo:deleted': (payload) => wsHandlers['todo:deleted'].forEach((fn) => fn(payload)),
  'todo:reordered': (payload) => wsHandlers['todo:reordered'].forEach((fn) => fn(payload)),
});

async function fetchTeam() {
  const res = await fetch('/api/team');
  const data = await res.json();
  team.value = data.usernames;
  org.value = data.org;
}

async function fetchPrs() {
  prLoading.value = true;
  try {
    const res = await fetch('/api/github/prs');
    prCounts.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch PR counts:', e);
  } finally {
    prLoading.value = false;
  }
}

onMounted(async () => {
  await fetchTeam();
  await fetchPrs();
});
</script>

<template>
  <div class="app">
    <header class="app__header">
      <h1 class="app__title">Daily Scrum</h1>
      <div class="app__header-actions">
        <button
          class="app__theme-btn"
          :aria-label="
            preference === 'system'
              ? 'Theme: system — click to override'
              : `Theme: ${resolvedDark ? 'dark' : 'light'} — click to toggle`
          "
          @click="toggleTheme"
          @dblclick.prevent="resetToSystem"
        >
          {{ resolvedDark ? '☀' : '☾' }}
          <span class="app__theme-label">
            {{ preference === 'system' ? 'System' : resolvedDark ? 'Dark' : 'Light' }}
          </span>
        </button>
        <button
          class="app__refresh-btn"
          :disabled="prLoading"
          :aria-busy="prLoading"
          @click="fetchPrs"
        >
          {{ prLoading ? 'Refreshing…' : 'Refresh PRs' }}
        </button>
      </div>
    </header>

    <main class="app__grid">
      <TeamMemberCard
        v-for="username in team"
        :key="username"
        :username="username"
        :org="org"
        :prCount="prCounts[username] ?? null"
        :wsHandlers="wsHandlers"
      />
    </main>
  </div>
</template>
