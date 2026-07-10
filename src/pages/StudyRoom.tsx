import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { scenes, type Scene } from '../data/scenes';
import MusicPlayer from '../components/Controls/MusicPlayer';
import Pomodoro from '../components/Controls/Pomodoro';
import Countdown from '../components/Controls/Countdown';
import TodoList from '../components/Controls/TodoList';
import ParallaxClock from '../components/Controls/ParallaxClock';
import type { PomodoroState } from '../components/Controls/Pomodoro';
import type { CountdownState } from '../components/Controls/Countdown';
import { ArrowLeft, Timer, Clock, ChevronDown, Music, Image, GripVertical, Minus, Maximize2, Play, Pause } from 'lucide-react';

type TimerTab = 'pomodoro' | 'countdown';

function usePanelLayout() {
  const calc = () => {
    const w = window.innerWidth;
    const pad = 40;
    return {
      music: { x: pad, y: 446, w: 400, h: 300 },
      timer: { x: w - 300 - pad, y: 0, w: 300, h: 370 },
      todo:  { x: w - 300 - pad, y: 446, w: 300, h: 320 },
      key: `${Math.round(w / 50)}`,
    };
  };
  const [layout, setLayout] = useState(calc);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setLayout(calc()), 80);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(timer); };
  }, []);
  return layout;
}

function usePomodoroState(): PomodoroState {
  const { pomodoroWork, pomodoroBreak, addPomodoro } = useStore();
  const [seconds, setSeconds] = useState(pomodoroWork * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'work' | 'break'>('work');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const totalSeconds = status === 'work' ? pomodoroWork * 60 : pomodoroBreak * 60;
  const progress = seconds / totalSeconds;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatted = formatTime(seconds);

  const playNotification = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, []);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setStatus('work');
    setSeconds(pomodoroWork * 60);
  }, [pomodoroWork]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            playNotification();
            if (status === 'work') {
              addPomodoro();
              setStatus('break');
              return pomodoroBreak * 60;
            } else {
              setStatus('work');
              return pomodoroWork * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, status, pomodoroWork, pomodoroBreak, addPomodoro, playNotification]);

  useEffect(() => {
    if (!isRunning) {
      setSeconds(status === 'work' ? pomodoroWork * 60 : pomodoroBreak * 60);
    }
  }, [pomodoroWork, pomodoroBreak, status, isRunning]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return { formatted, isRunning, status, progress, start, pause, reset };
}

function useCountdownState(): CountdownState {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [minutes, setMinutesState] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatted = formatTime(seconds);
  const progress = minutes > 0 ? seconds / (minutes * 60) : 1;

  const playNotification = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.6);
  }, []);

  const setMinutes = useCallback((mins: number) => {
    setMinutesState(mins);
    if (!isRunning) setSeconds(mins * 60);
  }, [isRunning]);

  const start = useCallback(() => {
    if (seconds > 0) setIsRunning(true);
  }, [seconds]);

  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(minutes * 60);
  }, [minutes]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            playNotification();
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, playNotification]);

  useEffect(() => {
    if (!isRunning && seconds === 0 && minutes > 0) {
      setSeconds(minutes * 60);
    }
  }, [minutes, isRunning, seconds]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return { formatted, isRunning, progress, minutes, setMinutes, start, pause, reset };
}

function useZIndexStack() {
  const counterRef = useRef(10);
  const [zIndices, setZIndices] = useState<Record<string, number>>({});

  const bringToFront = useCallback((id: string) => {
    counterRef.current += 1;
    setZIndices(prev => ({ ...prev, [id]: counterRef.current }));
  }, []);

  return { zIndices, bringToFront };
}

function DraggablePanel({
  title,
  icon,
  children,
  initialX,
  initialY,
  initialWidth,
  initialHeight,
  minimizedContent,
  isMinimized,
  onToggleMinimize,
  showMinimizeButton = true,
  panelId,
  zIndex = 10,
  onFocus,
  layoutKey,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  minimizedContent?: React.ReactNode;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  showMinimizeButton?: boolean;
  panelId?: string;
  zIndex?: number;
  onFocus?: () => void;
  layoutKey?: string;
}) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const userMovedRef = useRef(false);

  useEffect(() => {
    if (layoutKey) {
      setPosition({ x: initialX, y: initialY });
      setSize({ width: initialWidth, height: initialHeight });
      userMovedRef.current = false;
    }
  }, [layoutKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onFocus?.();
    setIsDragging(true);
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y, width: 0, height: 0 };
  }, [position, onFocus]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus?.();
    setIsResizing(true);
    startPos.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
  }, [size, onFocus]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y });
      }
      if (isResizing) {
        setSize({
          width: Math.max(200, startPos.current.width + (e.clientX - startPos.current.x)),
          height: Math.max(200, startPos.current.height + (e.clientY - startPos.current.y)),
        });
      }
    };
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  return (
    <div
      ref={dragRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: isDragging || isResizing ? Math.max(zIndex, 50) : zIndex,
        transition: isDragging || isResizing ? 'none' : 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease',
      }}
      className="group flex flex-col rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      <div
        onMouseDown={handleMouseDown}
        className="flex cursor-grab items-center justify-between border-b border-white/10 px-3 py-2 active:cursor-grabbing select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-white/80">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {showMinimizeButton && onToggleMinimize && (
            <button onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }} className="rounded-md p-1 text-white/30 transition-all hover:bg-white/10 hover:text-white/60">
              {isMinimized ? <Maximize2 size={12} /> : <Minus size={12} />}
            </button>
          )}
          <GripVertical size={12} className="text-white/30" />
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-auto p-3" style={{ minHeight: 0 }}>
        {isMinimized && minimizedContent ? minimizedContent : children}
      </div>
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 right-0 flex h-5 w-5 cursor-se-resize items-center justify-center rounded-bl-xl rounded-tr-2xl bg-white/5 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
        style={{ opacity: isResizing ? 1 : undefined }}
      >
        <svg width="6" height="6" viewBox="0 0 8 8" className="text-white/30">
          <path d="M8 0v8H0" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 4v4H4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

function TimerMinimized({ tab, pomodoro, countdown }: { tab: TimerTab; pomodoro: PomodoroState; countdown: CountdownState }) {
  const formatted = tab === 'pomodoro' ? pomodoro.formatted : countdown.formatted;
  const isRunning = tab === 'pomodoro' ? pomodoro.isRunning : countdown.isRunning;
  const status = tab === 'pomodoro' ? pomodoro.status : null;
  const progress = tab === 'pomodoro' ? pomodoro.progress : countdown.progress;
  const toggle = tab === 'pomodoro' ? (pomodoro.isRunning ? pomodoro.pause : pomodoro.start) : (countdown.isRunning ? countdown.pause : countdown.start);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {tab === 'pomodoro' ? <Timer size={12} className="text-white/60" /> : <Clock size={12} className="text-white/60" />}
        <div className="flex flex-col flex-1">
          <span className="font-mono text-sm font-medium text-white/80 tabular-nums">{formatted}</span>
          {tab === 'pomodoro' && <span className="text-[10px] text-white/40">{status === 'work' ? '工作中' : '休息中'}</span>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="rounded p-0.5 text-white/60 transition-all hover:bg-white/10 hover:text-white"
        >
          {isRunning ? <Pause size={10} /> : <Play size={10} />}
        </button>
      </div>
      <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-white/40 transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

export default function StudyRoom() {
  const selectedScene = useStore((s) => s.selectedScene);
  const setScene = useStore((s) => s.setScene);
  const customScenes = useStore((s) => s.customScenes);
  const [timerTab, setTimerTab] = useState<TimerTab>('pomodoro');
  const [showSceneDropdown, setShowSceneDropdown] = useState(false);
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);
  const { zIndices, bringToFront } = useZIndexStack();

  const allScenes: Scene[] = useMemo(() => [
    ...scenes,
    ...customScenes.map((cs) => ({
      id: cs.id,
      name: cs.name,
      emoji: cs.emoji,
      description: cs.description,
      image: cs.image,
    })),
  ], [customScenes]);

  const scene = allScenes.find((s) => s.id === selectedScene) ?? allScenes[0];
  const pomodoro = usePomodoroState();
  const countdown = useCountdownState();
  const panelLayout = usePanelLayout();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {scene.video ? (
        <video src={scene.video} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <img src={scene.image} alt={scene.name} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="relative z-10 flex h-full flex-col">
        <header className="flex items-center justify-between px-6 py-4 z-20">
          <Link to="/" className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-white/15 active:scale-95">
            <ArrowLeft size={16} />
            <span>返回</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowSceneDropdown(!showSceneDropdown)} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-white/15">
                <Image size={15} />
                <span>{scene.emoji} {scene.name}</span>
                <ChevronDown size={14} className={`transition-transform ${showSceneDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSceneDropdown && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-0 top-full z-50 mt-2 w-56 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-black/80 p-2 backdrop-blur-xl">
                    {allScenes.map((s) => (
                      <button key={s.id} onClick={() => { setScene(s.id); setShowSceneDropdown(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${selectedScene === s.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white/80'}`}>
                        <span className="text-lg">{s.emoji}</span>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-white/40">{s.description}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div />
        </header>

        <ParallaxClock />

        <div className="relative flex-1">
          <DraggablePanel
            title="音乐播放"
            icon={<Music size={14} className="text-white/50" />}
            initialX={panelLayout.music.x}
            initialY={panelLayout.music.y}
            initialWidth={panelLayout.music.w}
            initialHeight={panelLayout.music.h}
            showMinimizeButton={false}
            panelId="music"
            zIndex={zIndices['music'] ?? 10}
            onFocus={() => bringToFront('music')}
            layoutKey={panelLayout.key}
          >
            <MusicPlayer />
          </DraggablePanel>

          <DraggablePanel
            title={timerTab === 'pomodoro' ? '番茄钟' : '倒计时'}
            icon={timerTab === 'pomodoro' ? <Timer size={14} className="text-white/50" /> : <Clock size={14} className="text-white/50" />}
            initialX={panelLayout.timer.x}
            initialY={panelLayout.timer.y}
            initialWidth={panelLayout.timer.w}
            initialHeight={panelLayout.timer.h}
            isMinimized={isTimerMinimized}
            onToggleMinimize={() => setIsTimerMinimized(prev => !prev)}
            minimizedContent={<TimerMinimized tab={timerTab} pomodoro={pomodoro} countdown={countdown} />}
            panelId="timer"
            zIndex={zIndices['timer'] ?? 11}
            onFocus={() => bringToFront('timer')}
            layoutKey={panelLayout.key}
          >
            <div className="mb-3 flex items-center justify-center gap-1 rounded-lg bg-white/5 p-1">
              <button onClick={() => setTimerTab('pomodoro')} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all ${timerTab === 'pomodoro' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'}`}>
                <Timer size={11} /> 番茄钟
              </button>
              <button onClick={() => setTimerTab('countdown')} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-all ${timerTab === 'countdown' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70'}`}>
                <Clock size={11} /> 倒计时
              </button>
            </div>
            {timerTab === 'pomodoro' ? <Pomodoro pomodoroState={pomodoro} /> : <Countdown countdownState={countdown} />}
          </DraggablePanel>

          <DraggablePanel
            title="待办任务"
            icon={<span className="text-xs">✅</span>}
            initialX={panelLayout.todo.x}
            initialY={panelLayout.todo.y}
            initialWidth={panelLayout.todo.w}
            initialHeight={panelLayout.todo.h}
            showMinimizeButton={false}
            panelId="todo"
            zIndex={zIndices['todo'] ?? 12}
            onFocus={() => bringToFront('todo')}
            layoutKey={panelLayout.key}
          >
            <TodoList />
          </DraggablePanel>
        </div>
      </motion.div>
    </div>
  );
}