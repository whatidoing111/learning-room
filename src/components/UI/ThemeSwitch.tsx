import { useStore } from '@/store/useStore';
import type { Theme } from '@/store/useStore';
import { cn } from '@/lib/utils';

const themes: { key: Theme; emoji: string; label: string }[] = [
  { key: 'light', emoji: '☀️', label: '日间' },
  { key: 'dark', emoji: '🌙', label: '夜间' },
  { key: 'rain', emoji: '🌧️', label: '雨天' },
];

export default function ThemeSwitch() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {themes.map((t) => (
        <button
          key={t.key}
          onClick={() => setTheme(t.key)}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm',
            'border border-white/20 bg-white/10 backdrop-blur-md transition-all duration-200',
            'hover:bg-white/20',
            theme === t.key
              ? 'ring-2 ring-white/40 bg-white/20 shadow-md'
              : 'opacity-70 hover:opacity-100'
          )}
          title={t.label}
        >
          <span>{t.emoji}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
