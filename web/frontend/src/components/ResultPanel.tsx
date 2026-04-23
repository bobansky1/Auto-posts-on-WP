import type { GenerateResponse } from '../types';

interface Props {
  result: GenerateResponse;
}

export default function ResultPanel({ result }: Props) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-emerald-800">Статья успешно опубликована!</p>
      </div>
      <div className="flex flex-col gap-1.5 pl-9">
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 font-medium">Статус:</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            result.status === 'publish' ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
          }`}>
            {result.status === 'publish' ? 'Опубликовано' : 'Запланировано'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 font-medium">URL:</span>
          <a href={result.post_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-emerald-700 underline underline-offset-2 hover:text-emerald-900 truncate max-w-xs">
            {result.post_url}
          </a>
        </div>
      </div>
    </div>
  );
}
