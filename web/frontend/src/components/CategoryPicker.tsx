import { useEffect, useState } from 'react';

interface Category { id: number; name: string; }

interface Props {
  wpUrl: string;
  wpUsername: string;
  wpAppPassword: string;
  selected: number[];
  onChange: (ids: number[]) => void;
}

export default function CategoryPicker({ wpUrl, wpUsername, wpAppPassword, selected, onChange }: Props) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canLoad = wpUrl.trim() && wpUsername.trim() && wpAppPassword.trim();

  useEffect(() => {
    if (!canLoad) { setCats([]); return; }
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ wp_url: wpUrl, wp_username: wpUsername, wp_app_password: wpAppPassword });
    fetch(`/api/categories?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setCats([]); }
        else setCats(data);
      })
      .catch(() => setError('Не удалось загрузить рубрики'))
      .finally(() => setLoading(false));
  }, [wpUrl, wpUsername, wpAppPassword]);

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if (!canLoad) return (
    <p className="text-xs text-gray-400">Заполните URL, логин и пароль WordPress — рубрики подгрузятся автоматически</p>
  );

  if (loading) return <p className="text-xs text-gray-400">Загрузка рубрик…</p>;
  if (error) return <p className="text-xs text-red-400">{error}</p>;
  if (!cats.length) return <p className="text-xs text-gray-400">Рубрики не найдены</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {cats.map((c) => {
        const active = selected.includes(c.id);
        return (
          <button key={c.id} type="button" onClick={() => toggle(c.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400 hover:text-violet-600'
            }`}>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
