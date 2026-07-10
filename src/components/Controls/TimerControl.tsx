import { useTimer } from '@/hooks/useTimer';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function TimerControl() {
  const { formatted, isRunning, start, pause, reset } = useTimer();

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="font-mono text-6xl font-light tracking-wider text-white drop-shadow-lg tabular-nums">
        {formatted}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={isRunning ? pause : start}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
        >
          {isRunning ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button
          onClick={reset}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
