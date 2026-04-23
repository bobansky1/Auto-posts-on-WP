import { useState, useEffect } from 'react';
import { fetchHistory, clearHistory } from '../api';
import type { PublicationRecord } from '../types';

export default function HistoryTab() {
  const [entries, setEntries] = useState<PublicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ошибка загрузки истории'))
      .finally(() => setLoading(false));
  }, []);

  async function handleClear() {
    if (confirm('Очистить всю историю?')) {
      try {
        await clearHistory();
        setEntries([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка очистки истории');
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Загрузка...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">Нет опубликованных статей</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{entries.length} {entries.length === 1 ? 'статья' : entries.length < 5 ? 'статьи' : 'статей'}</p>
        <button
          onClick={handleClear}
          className="text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Очистить историю
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <div key={e.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">{e.prompt}</p>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                e.status === 'publish'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {e.status}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              <a
                href={e.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline truncate"
              >
                {e.post_url}
              </a>
              <p className="text-xs text-gray-400">
                {new Date(e.created_at).toLocaleString()} · {e.wp_url}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
