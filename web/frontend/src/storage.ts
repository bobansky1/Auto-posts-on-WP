import type { HistoryEntry, ModelSettings } from './types';

const HISTORY_KEY = 'aag_history';
const SETTINGS_KEY = 'aag_settings';

export const DEFAULT_SETTINGS: ModelSettings = {
  openrouter_model: 'openai/gpt-4o-mini',
};

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): void {
  const history = loadHistory();
  history.unshift({ ...entry, id: crypto.randomUUID() });
  // keep last 100 entries
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function loadSettings(): ModelSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: ModelSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
