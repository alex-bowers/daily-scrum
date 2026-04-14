import { ref, watchEffect } from 'vue';

const STORAGE_KEY = 'daily-scrum-theme';

const preference = ref(localStorage.getItem(STORAGE_KEY) ?? 'system');

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const resolvedDark = ref(
  preference.value === 'system' ? systemDark.matches : preference.value === 'dark'
);

systemDark.addEventListener('change', () => {
  if (preference.value === 'system') applyTheme();
});

function applyTheme() {
  const isDark =
    preference.value === 'dark' || (preference.value === 'system' && systemDark.matches);
  resolvedDark.value = isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, preference.value);
  applyTheme();
});

export function useTheme() {
  function toggle() {
    if (preference.value === 'system') {
      preference.value = resolvedDark.value ? 'light' : 'dark';
    } else if (preference.value === 'dark') {
      preference.value = 'light';
    } else {
      preference.value = 'dark';
    }
  }

  function resetToSystem() {
    preference.value = 'system';
  }

  return { preference, resolvedDark, toggle, resetToSystem };
}
