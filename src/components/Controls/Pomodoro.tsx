import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Play, Pause, RotateCcw, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PomodoroState {
  formatted: string;
  isRunning: boolean;
  status: 'work' | 'break';
  progress: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

const RADIUS = 52;
const STROKE_WIDTH = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const presetTimes = [
  { work: 25, break: 5, label: '经典', desc: '25/5' },
  { work: 45, break: 10, label: '深度', desc: '45/10' },
  { work: 50, break: 10, label: '长时', desc: '50/10' },
  { work: 15, break: 3, label: '短时', desc: '15/3' },
];

export default function Pomodoro({ pomodoroState }: { pomodoroState: PomodoroState }) {
  const {
    formatted,
    isRunning,
    status,
    progress,
    start,
    pause,
    reset,
  } = pomodoroState;

  const { pomodoroWork, pomodoroBreak, setPomodoroWork, setPomodoroBreak } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [workInput, setWorkInput] = useState(pomodoroWork.toString());
  const [breakInput, setBreakInput] = useState(pomodoroBreak.toString());

  const offset = CIRCUMFERENCE * (1 - progress);
  const progressPercent = Math.round(progress * 100);

  const handleApplySettings = () => {
    const work = parseInt(workInput) || 25;
    const breakTime = parseInt(breakInput) || 5;
    setPomodoroWork(Math.max(1, Math.min(120, work)));
    setPomodoroBreak(Math.max(1, Math.min(30, breakTime)));
    setShowSettings(false);
    reset();
  };

  const handlePreset = (work: number, breakTime: number) => {
    setWorkInput(work.toString());
    setBreakInput(breakTime.toString());
    setPomodoroWork(work);
    setPomodoroBreak(breakTime);
    setShowSettings(false);
    reset();
  };

  return (
    <div className="relative flex w-full flex-col items-center gap-5">
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute inset-x-0 top-0 z-50 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/95 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white/70">时间设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded p-0.5 text-white/30 transition-colors hover:text-white/60"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {presetTimes.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset.work, preset.break)}
                  className="flex flex-col items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 py-1.5 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <span className="text-[10px] font-medium text-white/60">{preset.label}</span>
                  <span className="text-[10px] text-white/30">{preset.desc}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
                <span className="text-[10px] text-white/50">工作</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={workInput}
                    onChange={(e) => setWorkInput(e.target.value)}
                    min="1"
                    max="120"
                    className="w-8 bg-transparent text-right text-xs text-white outline-none"
                  />
                  <span className="text-[10px] text-white/30">分</span>
                </div>
              </div>
              <div className="flex flex-1 items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
                <span className="text-[10px] text-white/50">休息</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={breakInput}
                    onChange={(e) => setBreakInput(e.target.value)}
                    min="1"
                    max="30"
                    className="w-8 bg-transparent text-right text-xs text-white outline-none"
                  />
                  <span className="text-[10px] text-white/30">分</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleApplySettings}
              className="w-full rounded-lg bg-white/10 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-white/15 active:scale-95"
            >
              应用
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center w-full max-w-[160px] aspect-square mx-auto">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE_WIDTH}
          />
          <motion.circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke={status === 'work' ? '#f97316' : '#22c55e'}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="text-[10px] font-medium tracking-wider text-white/40 uppercase">
            {status === 'work' ? '工作中' : '休息中'}
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-light tracking-tight text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatted}
          </span>
          <span className="text-[10px] text-white/30">{progressPercent}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px]">
        <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
          <div className={`h-1 w-1 rounded-full ${status === 'work' ? 'bg-orange-400' : 'bg-white/20'}`} />
          <span className="text-white/50">{pomodoroWork}分</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
          <div className={`h-1 w-1 rounded-full ${status === 'break' ? 'bg-green-400' : 'bg-white/20'}`} />
          <span className="text-white/50">{pomodoroBreak}分</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          onClick={isRunning ? pause : start}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/15"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </motion.button>
        <motion.button
          onClick={reset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white/70"
        >
          <RotateCcw size={14} />
        </motion.button>
        <motion.button
          onClick={() => setShowSettings(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white/70"
        >
          <Settings size={14} />
        </motion.button>
      </div>
    </div>
  );
}