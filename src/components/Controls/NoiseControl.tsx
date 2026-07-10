import { useWhiteNoise } from '@/hooks/useWhiteNoise';
import { cn } from '@/lib/utils';

export default function NoiseControl() {
  const { noises, volume, toggle, setVolume } = useWhiteNoise();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {noises.map((noise) => (
          <button
            key={noise.id}
            onClick={() => toggle(noise.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition-all duration-200',
              'border border-white/10 backdrop-blur-sm',
              noise.active
                ? 'bg-white/25 border-white/30 shadow-md scale-105'
                : 'bg-white/5 hover:bg-white/15'
            )}
          >
            <span className="text-2xl">{noise.emoji}</span>
            <span className="text-xs text-white/80">{noise.name}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 px-1">
        <span className="text-xs text-white/50">音量</span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
        />
        <span className="w-8 text-right text-xs tabular-nums text-white/50">
          {volume}
        </span>
      </div>
    </div>
  );
}
