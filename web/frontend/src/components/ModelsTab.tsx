import { useState } from 'react';
import { loadSettings, saveSettings } from '../storage';
import { OPENROUTER_MODELS } from '../types';
import type { ModelSettings } from '../types';

const inputCls =
  'rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export default function ModelsTab() {
  const [settings, setSettings] = useState<ModelSettings>(loadSettings);
  const [saved, setSaved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSettings({ openrouter_model: e.target.value });
    setSaved(false);
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Модель генерации текста (OpenRouter)</h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="openrouter_model" className="text-sm text-gray-600">Модель</label>
          <select
            id="openrouter_model"
            name="openrouter_model"
            value={settings.openrouter_model}
            onChange={handleChange}
            className={inputCls}
          >
            {OPENROUTER_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            gpt-4o-mini — быстрая и дешёвая (~$0.15/1000 запросов). Модели с :free — бесплатные, но медленнее.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Генерация изображений</h2>
        <p className="text-sm text-gray-600">
          Pollinations.ai — бесплатный, без ключей. Размер: 1200×630 (оптимально для featured images).
        </p>
      </section>

      <button
        onClick={handleSave}
        className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {saved ? '✓ Сохранено' : 'Сохранить настройки'}
      </button>
    </div>
  );
}
