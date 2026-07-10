import { useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CountdownState {
  formatted: string;
  isRunning: boolean;
  progress: number;
  minutes: number;
  setMinutes: (mins: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

const RADIUS = 60;
const STROKE_WIDTH = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Countdown({ countdownState }: { countdownState: CountdownState }) {
  const {
    formatted,
    isRunning,
    progress,
    minutes,
    setMinutes,
    start,
    pause,
    reset,
  } = countdownState;

  const [inputValue, setInputValue] = useState(minutes.toString());

  const offset = CIRCUMFERENCE * (1 - progress);
  const progressPercent = Math.round(progress * 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setMinutes(Math.min(180, num));
    }
  };

  const handleInputBlur = () => {
    const num = parseInt(inputValue);
    if (isNaN(num) || num <= 0) {
      setInputValue(minutes.toString());
    } else {
      setInputValue(Math.min(180, num).toString());
    }
  };

  const handleIncrement = () => {
    const newMinutes = Math.min(180, minutes + 1);
    setMinutes(newMinutes);
    setInputValue(newMinutes.toString());
  };

  const handleDecrement = () => {
    const newMinutes = Math.max(1, minutes - 1);
    setMinutes(newMinutes);
    setInputValue(newMinutes.toString());
  };

  return (
    <div className="relative flex w-full flex-col items-center gap-6">
      <div className="relative flex items-center justify-center w-full max-w-[180px] aspect-square mx-auto">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE_WIDTH}
          />
          <motion.circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="#3b82f6"
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
          <span className="mb-1 text-[10px] sm:text-xs font-medium tracking-wider text-white/40 uppercase">
            倒计时
          </span>
          <span className="font-mono text-3xl sm:text-4xl font-light tracking-tight text-white">
            {formatted}
          </span>
          <span className="mt-1 text-[10px] sm:text-xs text-white/30">
            {progressPercent}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={handleDecrement}
          disabled={isRunning}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white/70 disabled:opacity-30"
        >
          <Minus size={14} />
        </motion.button>
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2">
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={isRunning}
            min="1"
            max="180"
            className="w-10 bg-transparent text-center text-sm font-medium text-white outline-none disabled:opacity-50"
          />
          <span className="text-xs text-white/40">分钟</span>
        </div>
        <motion.button
          onClick={handleIncrement}
          disabled={isRunning}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white/70 disabled:opacity-30"
        >
          <Plus size={14} />
        </motion.button>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={isRunning ? pause : start}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/15"
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </motion.button>
        <motion.button
          onClick={reset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white/70"
        >
          <RotateCcw size={16} />
        </motion.button>
      </div>
    </div>
  );
}