import { useStore } from '@/store/useStore';

function formatStudyTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function Stats() {
  const stats = useStore((s) => s.stats);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular-nums text-white drop-shadow-lg">
            {formatStudyTime(stats.todayStudySeconds)}
          </span>
          <span className="text-xs text-white/60">今日学习</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular-nums text-white drop-shadow-lg">
            {stats.todayPomodoroCount}
          </span>
          <span className="text-xs text-white/60">番茄钟</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl font-bold tabular-nums text-white drop-shadow-lg">
            {stats.streakDays}
          </span>
          <span className="text-xs text-white/60">连续天数</span>
        </div>
      </div>
    </div>
  );
}
