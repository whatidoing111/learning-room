import { usePomodoro } from '@/hooks/usePomodoro';
import { Play, Pause, RotateCcw } from 'lucide-react';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function PomodoroControl() {
  const {
    formatted,
    isRunning,
    status,
    progress,
    workMinutes,
    restMinutes,
    setWorkMinutes,
    setRestMinutes,
    start,
    pause,
    reset,
  } = usePomodoro();

  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        <svg width="132" height="132" className="-rotate-90">
          <circle
            cx="66"
            cy="66"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="6"
          />
          <circle
            cx="66"
            cy="66"
            r={RADIUS}
            fill="none"
            stroke={status === 'work' ? '#f97316' : '#22c55e'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xs text-white/50">
            {status === 'work' ? '工作中' : '休息中'}
          </span>
          <span className="font-mono text-3xl font-light text-white drop-shadow-lg tabular-nums">
            {formatted}
          </span>
        </div>
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

      <div className="flex gap-4 text-xs text-white/60">
        <label className="flex items-center gap-1.5">
          工作
          <select
            value={workMinutes}
            onChange={(e) => setWorkMinutes(Number(e.target.value))}
            className="rounded bg-white/10 px-1.5 py-0.5 text-white/80 backdrop-blur-sm outline-none"
          >
            {[15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((m) => (
              <option key={m} value={m} className="text-gray-900">
                {m}m
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          休息
          <select
            value={restMinutes}
            onChange={(e) => setRestMinutes(Number(e.target.value))}
            className="rounded bg-white/10 px-1.5 py-0.5 text-white/80 backdrop-blur-sm outline-none"
          >
            {[3, 5, 10, 15, 20].map((m) => (
              <option key={m} value={m} className="text-gray-900">
                {m}m
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
