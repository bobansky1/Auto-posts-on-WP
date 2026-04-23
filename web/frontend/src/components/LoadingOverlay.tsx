export default function LoadingOverlay() {
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 flex items-center gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
      <div>
        <p className="text-sm font-semibold text-violet-800">Генерируем статью…</p>
        <p className="text-xs text-violet-600 mt-0.5">Это может занять 30–60 секунд. Пожалуйста, не закрывайте страницу.</p>
      </div>
    </div>
  );
}
