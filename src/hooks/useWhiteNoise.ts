import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';

type NoiseType = 'rain' | 'ocean' | 'forest' | 'fire' | 'bird' | 'wind' | 'thunder' | 'cafe';

class NoiseGenerator {
  private ctx: AudioContext;
  private nodes: AudioNode[] = [];
  private output: GainNode;

  constructor(ctx: AudioContext, type: NoiseType, volume: number) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.gain.value = volume;
    this.output.connect(ctx.destination);

    switch (type) {
      case 'rain':
        this.createRain();
        break;
      case 'ocean':
        this.createOcean();
        break;
      case 'forest':
        this.createForest();
        break;
      case 'fire':
        this.createFire();
        break;
      case 'bird':
        this.createBird();
        break;
      case 'wind':
        this.createWind();
        break;
      case 'thunder':
        this.createThunder();
        break;
      case 'cafe':
        this.createCafe();
        break;
    }
  }

  private createNoiseBuffer(duration: number = 2): AudioBuffer {
    const length = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  private createRain() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(4);
    noise.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800;
    lowpass.Q.value = 0.5;

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 200;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.4;

    noise.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.output);
    noise.start();

    this.nodes.push(noise, lowpass, highpass, gain);
  }

  private createOcean() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(6);
    noise.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 500;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.3;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.5;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.output);
    noise.start();
    lfo.start();

    this.nodes.push(noise, lowpass, lfo, lfoGain, gain);
  }

  private createForest() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(4);
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 3000;
    bandpass.Q.value = 0.8;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.output);
    noise.start();

    this.nodes.push(noise, bandpass, gain);
  }

  private createFire() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(3);
    noise.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 600;

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 100;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.35;

    noise.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.output);
    noise.start();

    this.nodes.push(noise, lowpass, highpass, gain);
  }

  private createBird() {
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 2000;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 3000;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 500;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.15;

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.output);
    osc1.start();
    osc2.start();
    lfo.start();

    this.nodes.push(osc1, osc2, lfo, lfoGain, gain);
  }

  private createWind() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(5);
    noise.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 400;

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);

    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.output);
    noise.start();
    lfo.start();

    this.nodes.push(noise, lowpass, lfo, lfoGain, gain);
  }

  private createThunder() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(4);
    noise.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 200;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.6;

    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.output);
    noise.start();

    this.nodes.push(noise, lowpass, gain);
  }

  private createCafe() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(5);
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1500;
    bandpass.Q.value = 1;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3000;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.25;

    noise.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.output);
    noise.start();

    this.nodes.push(noise, bandpass, lowpass, gain);
  }

  setVolume(volume: number) {
    this.output.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.1);
  }

  stop() {
    this.nodes.forEach(node => {
      if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
        try { node.stop(); } catch {}
      }
      node.disconnect();
    });
    this.output.disconnect();
    this.nodes = [];
  }
}

export function useWhiteNoise() {
  const noises = useStore((s) => s.noises);
  const toggleNoise = useStore((s) => s.toggleNoise);
  const noiseVolume = useStore((s) => s.noiseVolume);
  const setNoiseVolume = useStore((s) => s.setNoiseVolume);

  const activeNoises = useMemo(
    () => noises.filter((n) => n.active),
    [noises]
  );

  const ctxRef = useRef<AudioContext | null>(null);
  const generatorsRef = useRef<Map<string, NoiseGenerator>>(new Map());

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const startNoise = useCallback((id: string, type: NoiseType, vol: number) => {
    const ctx = getCtx();
    const generator = new NoiseGenerator(ctx, type, vol);
    generatorsRef.current.set(id, generator);
  }, [getCtx]);

  const stopNoise = useCallback((id: string) => {
    const generator = generatorsRef.current.get(id);
    if (generator) {
      generator.stop();
      generatorsRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const activeIds = new Set(activeNoises.map((n) => n.id));

    for (const id of generatorsRef.current.keys()) {
      if (!activeIds.has(id)) {
        stopNoise(id);
      }
    }

    const vol = noiseVolume / 100;
    for (const noise of activeNoises) {
      if (!generatorsRef.current.has(noise.id)) {
        startNoise(noise.id, noise.id as NoiseType, vol);
      }
    }
  }, [activeNoises, noiseVolume, startNoise, stopNoise]);

  useEffect(() => {
    const vol = noiseVolume / 100;
    for (const generator of generatorsRef.current.values()) {
      generator.setVolume(vol);
    }
  }, [noiseVolume]);

  useEffect(() => {
    return () => {
      for (const id of generatorsRef.current.keys()) {
        stopNoise(id);
      }
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, [stopNoise]);

  const toggle = useCallback(
    (id: string) => {
      toggleNoise(id);
    },
    [toggleNoise]
  );

  const setVolume = useCallback(
    (volume: number) => {
      setNoiseVolume(volume);
    },
    [setNoiseVolume]
  );

  return {
    noises,
    activeNoises,
    hasActive: activeNoises.length > 0,
    volume: noiseVolume,
    toggle,
    setVolume,
  };
}
