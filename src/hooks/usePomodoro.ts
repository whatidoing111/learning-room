import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';

export function usePomodoro() {
  const { pomodoroWork, pomodoroBreak, addPomodoro, setPomodoroWork, setPomodoroBreak } = useStore();
  const [seconds, setSeconds] = useState(pomodoroWork * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'work' | 'break'>('work');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const totalSeconds = status === 'work' ? pomodoroWork * 60 : pomodoroBreak * 60;
  const progress = seconds / totalSeconds;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
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

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setStatus('work');
    setSeconds(pomodoroWork * 60);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, status, pomodoroWork, pomodoroBreak, playNotification, addPomodoro]);

  useEffect(() => {
    if (!isRunning) {
      setSeconds(status === 'work' ? pomodoroWork * 60 : pomodoroBreak * 60);
    }
  }, [pomodoroWork, pomodoroBreak, status, isRunning]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { formatted, isRunning, status, progress, start, pause, reset, workMinutes: pomodoroWork, restMinutes: pomodoroBreak, setWorkMinutes: setPomodoroWork, setRestMinutes: setPomodoroBreak };
}