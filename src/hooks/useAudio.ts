import { useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';

type NoiseType = 'rain' | 'ocean' | 'forest' | 'fire' | 'thunder' | 'wind' | 'whitenoise' | 'brownnoise' | 'piano' | 'violin' | 'lofi' | 'jazz';

interface AudioNode {
  source: OscillatorNode | AudioBufferSourceNode;
  gain: GainNode;
  filters?: BiquadFilterNode[];
}

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Map<string, AudioNode>>(new Map());
  const { noises, noiseVolume } = useStore();

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const createNoiseBuffer = useCallback((type: NoiseType) => {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        switch (type) {
          case 'whitenoise':
            data[i] = Math.random() * 2 - 1;
            break;
          case 'brownnoise':
            const white = Math.random() * 2 - 1;
            data[i] = (data[i - 1] || 0) + (0.02 * white) / 1.02;
            data[i] *= 3.5;
            break;
          case 'rain':
            data[i] = Math.random() * 2 - 1;
            if (i % 3 === 0) data[i] *= 0.5;
            break;
          case 'ocean':
            data[i] = Math.sin(i / (ctx.sampleRate * 0.5)) * (Math.random() * 0.5 + 0.5);
            break;
          case 'forest':
            data[i] = Math.random() * 0.3;
            if (Math.random() > 0.999) data[i] = Math.random() * 2 - 1;
            break;
          case 'fire':
            data[i] = Math.random() * 2 - 1;
            if (Math.random() > 0.99) data[i] *= 3;
            break;
          case 'thunder':
            data[i] = Math.random() * 2 - 1;
            if (i % (ctx.sampleRate * 2) < ctx.sampleRate * 0.1) data[i] *= 5;
            break;
          case 'wind':
            data[i] = Math.sin(i / 100) * Math.random();
            break;
          default:
            data[i] = Math.random() * 2 - 1;
        }
      }
    }
    return buffer;
  }, [getAudioContext]);

  const createOscillatorNode = useCallback((type: NoiseType) => {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filters: BiquadFilterNode[] = [];

    switch (type) {
      case 'piano':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        break;
      case 'violin':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        break;
      case 'lofi':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, ctx.currentTime);
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(800, ctx.currentTime);
        filters.push(lpf);
        break;
      case 'jazz':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, ctx.currentTime);
        break;
      default:
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    }

    return { source: oscillator, gain, filters };
  }, [getAudioContext]);

  const play = useCallback((type: NoiseType) => {
    if (nodesRef.current.has(type)) return;

    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(noiseVolume / 100, ctx.currentTime);
    masterGain.connect(ctx.destination);

    if (['whitenoise', 'brownnoise', 'rain', 'ocean', 'forest', 'fire', 'thunder', 'wind'].includes(type)) {
      const buffer = createNoiseBuffer(type);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(masterGain);
      source.start();
      nodesRef.current.set(type, { source, gain: masterGain });
    } else {
      const { source, gain, filters } = createOscillatorNode(type);
      const oscillator = source as OscillatorNode;
      oscillator.connect(gain);
      if (filters && filters.length > 0) {
        filters.forEach(filter => {
          gain.connect(filter);
          filter.connect(masterGain);
        });
      } else {
        gain.connect(masterGain);
      }
      oscillator.start();
      nodesRef.current.set(type, { source: oscillator, gain: masterGain, filters });
    }
  }, [getAudioContext, noiseVolume, createNoiseBuffer, createOscillatorNode]);

  const stop = useCallback((type: NoiseType) => {
    const node = nodesRef.current.get(type);
    if (node) {
      node.source.stop();
      node.source.disconnect();
      node.gain.disconnect();
      node.filters?.forEach(f => f.disconnect());
      nodesRef.current.delete(type);
    }
  }, []);

  const toggle = useCallback((type: NoiseType) => {
    if (nodesRef.current.has(type)) {
      stop(type);
    } else {
      play(type);
    }
  }, [play, stop]);

  useEffect(() => {
    const activeNoises = noises.filter(n => n.active);
    activeNoises.forEach(noise => {
      if (!nodesRef.current.has(noise.id)) {
        play(noise.id as NoiseType);
      }
    });

    nodesRef.current.forEach((_, key) => {
      if (!activeNoises.find(n => n.id === key)) {
        stop(key as NoiseType);
      }
    });
  }, [noises, play, stop]);

  useEffect(() => {
    nodesRef.current.forEach(node => {
      const ctx = getAudioContext();
      node.gain.gain.setValueAtTime(noiseVolume / 100, ctx.currentTime);
    });
  }, [noiseVolume, getAudioContext]);

  useEffect(() => {
    return () => {
      nodesRef.current.forEach((node) => {
        node.source.stop();
        node.source.disconnect();
        node.gain.disconnect();
        node.filters?.forEach(f => f.disconnect());
      });
      nodesRef.current.clear();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { play, stop, toggle };
}