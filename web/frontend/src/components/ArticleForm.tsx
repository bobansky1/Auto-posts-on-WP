import { useState } from 'react';
import { generate, addHistoryEntry } from '../api';
import type { FormState, FormErrors, GenerateResponse } from '../types';
import { loadSettings } from '../storage';
import { isAuthenticated } from '../auth';
import LoadingOverlay from './LoadingOverlay';
import ResultPanel from './ResultPanel';
import ErrorPanel from './ErrorPanel';
import CategoryPicker from './CategoryPicker';

const INITIAL_STATE: FormState = {
  prompt: '',
  wp_url: '',
  wp_username: '',
  wp_app_password: '',
  openrouter_api_key: '',
  publish_at: '',
  categories: '',
  tags: '',
  image_count: 2,
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.prompt.trim()) errors.prompt = 'Обязательное поле';
  if (!form.wp_url.trim()) errors.wp_url = 'Обязательное поле';
  if (!form.wp_username.trim()) errors.wp_username = 'Обязательное поле';
  if (!form.wp_app_password.trim()) errors.wp_app_password = 'Обязательное поле';
  if (!form.openrouter_api_key.trim()) errors.openrouter_api_key = 'Обязательное поле';
  if (form.publish_at.trim() && isNaN(new Date(form.publish_at.trim()).getTime())) {
    errors.publish_at = 'Неверный формат даты (ISO 8601)';
  }
  return errors;
}

interface FieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, id, error, hint, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-violet-500 text-xs">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>}
    </div>
  );
}

const inputCls = (hasError?: string) =>
  `w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
    hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400'
  }`;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{children}</p>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

interface Props {
  onPublished?: () => void;
}

export default function ArticleForm({ onPublished }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'image_count' ? (parseInt(value, 10) as 2 | 3) : value }));
    if (name in errors) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }

    setLoading(true);
    setResult(null);
    setApiError(null);

    const settings = loadSettings();

    try {
      const req = {
        prompt: form.prompt.trim(),
        wp_url: form.wp_url.trim(),
        wp_username: form.wp_username.trim(),
        wp_app_password: form.wp_app_password,
        openrouter_api_key: form.openrouter_api_key,
        openrouter_model: settings.openrouter_model,
        image_count: form.image_count,
        ...(form.publish_at.trim() ? { publish_at: form.publish_at.trim() } : {}),
        ...(selectedCategories.length ? { categories: selectedCategories } : {}),
        ...(form.tags.trim() ? { tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) } : {}),
      };

      const res = await generate(req);
      setResult(res);
      if (isAuthenticated()) {
        await addHistoryEntry({ prompt: form.prompt.trim(), post_url: res.post_url, status: res.status, wp_url: form.wp_url.trim() });
      }
      onPublished?.();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Неожиданная ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>

      {/* Content section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <SectionTitle>Контент</SectionTitle>
        <Field label="Промт" id="prompt" error={errors.prompt} required
          hint="Опишите тему статьи — чем подробнее, тем лучше результат">
          <textarea id="prompt" name="prompt" rows={5} value={form.prompt} onChange={handleChange}
            placeholder="Напишите подробную статью о преимуществах Python для машинного обучения…"
            className={inputCls(errors.prompt)} />
        </Field>
      </div>

      {/* WordPress section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <SectionTitle>WordPress</SectionTitle>
        <div className="flex flex-col gap-4">
          <Field label="URL сайта" id="wp_url" error={errors.wp_url} required>
            <input id="wp_url" name="wp_url" type="text" value={form.wp_url} onChange={handleChange}
              placeholder="https://example.com" className={inputCls(errors.wp_url)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Логин" id="wp_username" error={errors.wp_username} required>
              <input id="wp_username" name="wp_username" type="text" value={form.wp_username} onChange={handleChange}
                placeholder="admin" className={inputCls(errors.wp_username)} />
            </Field>
            <Field label="Application Password" id="wp_app_password" error={errors.wp_app_password} required>
              <input id="wp_app_password" name="wp_app_password" type="password" value={form.wp_app_password}
                onChange={handleChange} placeholder="xxxx xxxx xxxx xxxx" className={inputCls(errors.wp_app_password)} />
            </Field>
          </div>
        </div>
      </div>

      {/* API Keys section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <SectionTitle>API ключи</SectionTitle>
        <Field label="OpenRouter API Key" id="openrouter_api_key" error={errors.openrouter_api_key} required
          hint="Получить на openrouter.ai → Keys">
          <input id="openrouter_api_key" name="openrouter_api_key" type="password" value={form.openrouter_api_key}
            onChange={handleChange} placeholder="sk-or-v1-…" className={inputCls(errors.openrouter_api_key)} />
        </Field>
      </div>

      {/* Options section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <SectionTitle>Параметры публикации</SectionTitle>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Дата публикации" id="publish_at" error={errors.publish_at}
              hint="Оставьте пустым для немедленной публикации">
              <input id="publish_at" name="publish_at" type="text" value={form.publish_at} onChange={handleChange}
                placeholder="2025-12-31T10:00:00Z" className={inputCls(errors.publish_at)} />
            </Field>
            <Field label="Количество изображений" id="image_count">
              <select id="image_count" name="image_count" value={form.image_count} onChange={handleChange}
                className={inputCls()}>
                <option value={2}>2 изображения</option>
                <option value={3}>3 изображения</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Рубрики" id="categories" error={errors.categories}>
              <CategoryPicker
                wpUrl={form.wp_url}
                wpUsername={form.wp_username}
                wpAppPassword={form.wp_app_password}
                selected={selectedCategories}
                onChange={setSelectedCategories}
              />
            </Field>
            <Field label="Теги" id="tags" hint="Названия через запятую">
              <input id="tags" name="tags" type="text" value={form.tags} onChange={handleChange}
                placeholder="python, ai, tutorial" className={inputCls()} />
            </Field>
          </div>
        </div>
      </div>

      {/* Result / Error / Loading */}
      {loading && <LoadingOverlay />}
      {result && !loading && <ResultPanel result={result} />}
      {apiError && !loading && <ErrorPanel message={apiError} />}

      {/* Submit */}
      <button type="submit" disabled={loading}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150">
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Генерация…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Сгенерировать и опубликовать
          </>
        )}
      </button>
    </form>
  );
}
