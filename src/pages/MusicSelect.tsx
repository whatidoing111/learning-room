import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, animate, useMotionValueEvent } from 'framer-motion';
import { musicList, musicCategories, type MusicCategory, type Music } from '@/data/music';
import { useStore } from '@/store/useStore';
import { ArrowLeft, Play, Heart, Plus, X, Music as MusicIcon, Trash2 } from 'lucide-react';

const RADIUS = 380;
const VISIBLE_ARC = 120;
const CX = 180;
const ITEM_W = 280;

function normAngle(d: number): number {
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

const accents: Record<MusicCategory, { glow: string; btn: string; text: string; dot: string }> = {
  all: { glow: 'rgba(168,85,247,0.06)', btn: 'rgba(168,85,247,0.12)', text: 'text-purple-500', dot: 'rgba(168,85,247,0.4)' },
  nature: { glow: 'rgba(74,222,128,0.06)', btn: 'rgba(74,222,128,0.1)', text: 'text-green-500', dot: 'rgba(74,222,128,0.4)' },
  whitenoise: { glow: 'rgba(56,189,248,0.06)', btn: 'rgba(56,189,248,0.1)', text: 'text-sky-500', dot: 'rgba(56,189,248,0.4)' },
  light: { glow: 'rgba(251,191,36,0.06)', btn: 'rgba(251,191,36,0.1)', text: 'text-amber-500', dot: 'rgba(251,191,36,0.4)' },
  lofi: { glow: 'rgba(244,114,182,0.06)', btn: 'rgba(244,114,182,0.1)', text: 'text-pink-500', dot: 'rgba(244,114,182,0.4)' },
};

export default function MusicSelect() {
  const navigate = useNavigate();
  const setMusic = useStore((s) => s.setMusic);
  const favoriteMusic = useStore((s) => s.favoriteMusic);
  const toggleFavoriteMusic = useStore((s) => s.toggleFavoriteMusic);
  const user = useStore((s) => s.user);
  const customMusicList = useStore((s) => s.customMusic);
  const addCustomMusic = useStore((s) => s.addCustomMusic);
  const removeCustomMusic = useStore((s) => s.removeCustomMusic);
  const [activeCategory, setActiveCategory] = useState<MusicCategory>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadEmoji, setUploadEmoji] = useState('🎵');
  const [uploadDesc, setUploadDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);
  const [flyingItem, setFlyingItem] = useState<{ emoji: string; name: string; startX: number; startY: number; endX: number; endY: number } | null>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const flyAnimRef = useRef<ReturnType<typeof animate> | null>(null);
  const motionAngle = useMotionValue(0);
  const springAngle = useSpring(motionAngle, { stiffness: 300, damping: 28, mass: 0.6 });
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const vel = useRef(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const CY = useRef(typeof window !== 'undefined' ? window.innerHeight / 2 : 540);
  const mounted = useRef(false);

  const filtered: Music[] = useMemo(() => {
    const builtin = activeCategory === 'all' ? musicList : musicList.filter((m) => m.category === activeCategory);
    const custom = activeCategory === 'all'
      ? customMusicList
      : customMusicList.filter((m) => m.category === activeCategory);
    return [
      ...builtin,
      ...custom.map((cm) => ({
        id: cm.id,
        name: cm.name,
        emoji: cm.emoji,
        description: cm.description,
        category: (cm.category || 'light') as MusicCategory,
      })),
    ];
  }, [activeCategory, customMusicList]);

  const total = filtered.length;
  const angleStep = 360 / total;

  const updateItems = useCallback((v: number) => {
    let best = 0;
    let bestDist = 999;
    const half = VISIBLE_ARC / 2;
    const cy = CY.current;

    for (let i = 0; i < total; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const ea = normAngle(i * angleStep + v);
      const rad = (ea * Math.PI) / 180;
      const x = CX + RADIUS * Math.cos(rad) - ITEM_W / 2;
      const y = cy - RADIUS * Math.sin(rad) - 34;
      el.style.transform = `translate3d(${x}px,${y}px,0)`;
      const abs = Math.abs(ea);
      if (abs <= half + 8) {
        const p = 1 - abs / half;
        el.style.opacity = String(Math.max(0.08, p * p));
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
      if (abs < bestDist) { bestDist = abs; best = i; }
    }

    const ind = indicatorRef.current;
    if (ind) {
      const ea0 = normAngle(best * angleStep + v);
      const rad0 = (ea0 * Math.PI) / 180;
      ind.style.transform = `translate3d(${CX + RADIUS * Math.cos(rad0) - ITEM_W / 2 - 8}px,${cy - RADIUS * Math.sin(rad0) - 34 + 8}px,0)`;
      ind.style.opacity = '1';
    }

    if (best !== activeRef.current) {
      activeRef.current = best;
      setActiveIndex(best);
    }
  }, [total, angleStep]);

  useMotionValueEvent(springAngle, 'change', updateItems);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      updateItems(0);
    }
  }, [updateItems]);

  useEffect(() => {
    const cur = motionAngle.get();
    const nearest = Math.round(cur / angleStep) * angleStep;
    if (Math.abs(cur - nearest) > 0.5) {
      snapTo(nearest);
    } else {
      updateItems(cur);
    }
  }, [total, angleStep]);

  const displayIdx = ((activeIndex % total) + total) % total;
  const activeMusic = filtered[displayIdx] ?? filtered[0];
  const accent = accents[activeMusic?.category ?? activeCategory];

  const snapTo = useCallback((target: number) => {
    if (animRef.current) animRef.current.stop();
    animRef.current = animate(motionAngle, target, {
      type: 'spring', stiffness: 300, damping: 28, mass: 0.6,
    });
  }, [motionAngle]);

  const snapToItem = useCallback((itemIdx: number) => {
    const cur = motionAngle.get();
    const base = -itemIdx * angleStep;
    const wraps = Math.round((cur - base) / 360);
    snapTo(base + wraps * 360);
  }, [motionAngle, angleStep, snapTo]);

  useEffect(() => {
    activeRef.current = 0;
    setActiveIndex(0);
    motionAngle.set(0);
    snapTo(0);
  }, [activeCategory, motionAngle, snapTo]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    snapTo(motionAngle.get() + (e.deltaY > 0 ? -1 : 1) * angleStep);
  }, [motionAngle, angleStep, snapTo]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastY.current = e.clientY;
    vel.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dy = e.clientY - lastY.current;
    lastY.current = e.clientY;
    vel.current = dy;
    motionAngle.set(motionAngle.get() + dy * 0.3);
  }, [motionAngle]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const proj = motionAngle.get() + vel.current * 3;
    snapTo(Math.round(proj / angleStep) * angleStep);
  }, [motionAngle, angleStep, snapTo]);

  const handleSelect = (id: string) => { setMusic(id); navigate('/room'); };

  const svgW = CX + RADIUS + 120;
  const svgH = RADIUS * 2 + 120;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden select-none"
      style={{ background: 'linear-gradient(135deg, #f8f6f3 0%, #ffffff 30%, #f5f0eb 60%, #faf8f5 100%)', touchAction: 'none' }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 pt-6 pb-3">
        <div className="flex items-center gap-5">
          <Link to="/" className="group flex items-center gap-2 text-gray-400 transition-colors hover:text-gray-600">
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="text-xs tracking-wide">返回</span>
          </Link>
          <div className="h-3 w-px bg-gray-200" />
          <span className="text-[11px] font-light tracking-[0.2em] text-gray-300 uppercase" style={{ fontFamily: "'DM Sans', sans-serif" }}>选择背景音乐</span>
        </div>
        <div className="flex items-center gap-1.5">
          {musicCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={(e) => { e.stopPropagation(); setActiveCategory(cat.key); }}
              className={`rounded-full px-3.5 py-1 text-[11px] font-medium tracking-wide transition-colors duration-200 border ${
                activeCategory === cat.key
                  ? `${accents[cat.key].text} border-gray-200`
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
              style={activeCategory === cat.key ? { background: accents[cat.key].btn } : undefined}
            >
              {cat.label}
            </button>
          ))}
          {user ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowUpload(true); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="group flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white/60 text-gray-400 transition-all hover:bg-white hover:text-gray-600 hover:border-purple-300 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)]"
            >
              <Plus size={12} className="transition-transform group-hover:rotate-90 duration-300" />
            </button>
          ) : (
            <Link to="/profile" className="text-[11px] text-gray-300 transition-colors hover:text-gray-500 ml-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              登录后可自定义添加
            </Link>
          )}
        </div>
      </header>

      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 50% at 40% 50%, ${accent.glow}, transparent)` }} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative z-10 flex h-full flex-col pt-14">

        <motion.div
          className="pointer-events-none absolute left-0 top-14 bottom-0 w-[40%]"
          animate={{
            scale: hoveredSide === 'left' ? 1.18 : hoveredSide === 'right' ? 0.88 : 1,
            x: hoveredSide === 'left' ? '12%' : hoveredSide === 'right' ? '-8%' : 0,
            opacity: hoveredSide === 'right' ? 0.5 : 1,
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: '50% 50%' }}
        >
          <svg width={svgW} height={svgH} className="absolute" style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}>
            <defs>
              <mask id="sector-mask-music">
                <rect x="0" y="0" width={svgW} height={svgH} fill="black" />
                <path d={(() => {
                  const r = RADIUS + 60;
                  const s = ((-VISIBLE_ARC / 2) * Math.PI) / 180;
                  const e = ((VISIBLE_ARC / 2) * Math.PI) / 180;
                  return `M ${CX} ${CY.current} L ${CX + r * Math.cos(s)} ${CY.current - r * Math.sin(s)} A ${r} ${r} 0 0 1 ${CX + r * Math.cos(e)} ${CY.current - r * Math.sin(e)} Z`;
                })()} fill="white" />
              </mask>
            </defs>
            <circle cx={CX} cy={CY.current} r={RADIUS} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" strokeDasharray="4 8" mask="url(#sector-mask-music)" />
            {[-45, -30, -15, 0, 15, 30, 45].map((a) => {
              const rad = (a * Math.PI) / 180;
              return <line key={a} x1={CX + 80 * Math.cos(rad)} y1={CY.current - 80 * Math.sin(rad)} x2={CX + (RADIUS + 30) * Math.cos(rad)} y2={CY.current - (RADIUS + 30) * Math.sin(rad)} stroke={a === 0 ? 'rgba(168,85,247,0.12)' : 'rgba(0,0,0,0.025)'} strokeWidth="1" strokeDasharray={a === 0 ? '4 6' : '2 6'} mask="url(#sector-mask-music)" />;
            })}
            {[100, 200, 300].map((r) => (
              <circle key={r} cx={CX} cy={CY.current} r={r} fill="none" stroke="rgba(0,0,0,0.025)" strokeWidth="1" mask="url(#sector-mask-music)" />
            ))}
          </svg>

          <div className="pointer-events-none absolute" style={{ left: CX - 5, top: CY.current - 5, width: 10, height: 10, borderRadius: '50%', background: accent.dot, boxShadow: `0 0 20px ${accent.dot.replace('0.4', '0.25')}, 0 0 60px ${accent.dot.replace('0.4', '0.08')}` }} />

          <div ref={indicatorRef} className="pointer-events-none absolute" style={{ left: 0, top: 0, width: 3, height: 56, borderRadius: 2, background: accent.dot.replace('0.4', '0.9'), opacity: 0, willChange: 'transform' }} />

          <div className="pointer-events-auto absolute inset-0" onMouseEnter={() => setHoveredSide('left')} onMouseLeave={() => setHoveredSide(null)}>
            {filtered.map((music, index) => {
              const isCustom = customMusicList.some(cm => cm.id === music.id);
              return (
              <button
                key={music.id}
                ref={(el) => { itemRefs.current[index] = el; }}
                className="absolute flex items-center gap-3.5 rounded-xl px-5 py-3.5 hover:bg-black/[0.03]"
                style={{
                  left: 0, top: 0, width: ITEM_W, willChange: 'transform,opacity', opacity: 0,
                  transition: 'opacity 0.25s ease-out',
                }}
                onClick={() => {
                  if (index === displayIdx) handleSelect(music.id);
                  else snapToItem(index);
                }}
              >
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${index === displayIdx ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border border-gray-100'}`}>
                  <span className="text-lg">{music.emoji}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-[14px] truncate transition-colors duration-300 ${index === displayIdx ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>{music.name}</p>
                  <p className={`text-[11px] truncate mt-0.5 transition-colors duration-300 ${index === displayIdx ? accent.text : 'text-gray-300'}`}>{musicCategories.find(c => c.key === music.category)?.label}</p>
                </div>
                {isCustom && user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomMusic(music.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="pointer-events-auto absolute right-0 top-14 bottom-0 z-20 flex w-[40%] items-center justify-center px-8"
          animate={{
            scale: hoveredSide === 'right' ? 1.18 : hoveredSide === 'left' ? 0.88 : 1,
            x: hoveredSide === 'right' ? '-12%' : hoveredSide === 'left' ? '8%' : 0,
            opacity: hoveredSide === 'left' ? 0.5 : 1,
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setHoveredSide('right')}
          onMouseLeave={() => setHoveredSide(null)}
          style={{ transformOrigin: '50% 50%' }}
        >
          <div className="flex flex-col items-center gap-5 w-full max-w-[380px]">
            <AnimatePresence mode="wait">
              {activeMusic && (
                <motion.div
                  key={activeMusic.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, scale: 0.95, filter: 'blur(6px)' }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.8 }}
                  className="w-full"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200 p-8" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 100%)' }}>
                    <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl" style={{ background: accent.glow.replace('0.06', '0.15') }} />
                    <div className="relative flex flex-col items-center text-center">
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100" style={{ background: 'rgba(255,255,255,0.8)' }}>
                        <motion.span key={activeMusic.id} className="text-4xl inline-block" initial={{ scale: 0.6, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}>{activeMusic.emoji}</motion.span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <motion.h2
                          className="text-xl font-semibold text-gray-800 tracking-tight"
                          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08, duration: 0.3 }}
                        >{activeMusic.name}</motion.h2>
                        {user && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 }}
                            onClick={(e) => { e.stopPropagation(); toggleFavoriteMusic(activeMusic.id); }}
                            className="transition-colors"
                          >
                            <Heart size={16} className={favoriteMusic.includes(activeMusic.id) ? 'text-pink-400' : 'text-gray-300 hover:text-gray-500'} fill={favoriteMusic.includes(activeMusic.id) ? 'currentColor' : 'none'} />
                          </motion.button>
                        )}
                        {user && customMusicList.some(cm => cm.id === activeMusic.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCustomMusic(activeMusic.id);
                            }}
                            className="transition-colors text-gray-300 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <motion.div
                        className="mt-2 mb-4"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 22 }}
                      >
                        <span className={`rounded-full px-3 py-1 text-[10px] font-medium tracking-wide border border-gray-200 ${accent.text}`} style={{ background: accent.btn }}>{musicCategories.find(c => c.key === activeMusic.category)?.label}</span>
                      </motion.div>
                      <motion.p
                        className="max-w-xs text-[13px] leading-relaxed text-gray-500"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14, duration: 0.3 }}
                      >{activeMusic.description}</motion.p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1.5">
              {filtered.slice(0, Math.min(filtered.length, 12)).map((_, i) => (
                <button key={i} onClick={() => snapToItem(i)} className="transition-all duration-300">
                  <div className={`rounded-full transition-all duration-300 ${i === displayIdx ? 'h-1.5 w-5 bg-purple-400/40' : 'h-1.5 w-1.5 bg-gray-200 hover:bg-gray-300'}`} />
                </button>
              ))}
            </div>

            <motion.button
              onClick={() => activeMusic && handleSelect(activeMusic.id)}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-10 py-4 text-sm font-medium text-gray-600 backdrop-blur-sm transition-colors hover:border-gray-300 hover:text-gray-800"
              style={{ background: accent.btn }}
            >
              <Play size={14} />
              <span style={{ fontFamily: "'DM Sans', sans-serif" }}>使用「{activeMusic?.name}」进入学习室</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            setUploadPreview(ev.target?.result as string);
            setUploadFileName(file.name);
            setUploadName(file.name.replace(/\.[^/.]+$/, ''));
            setShowUpload(true);
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
      />

      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => { setShowUpload(false); setUploadPreview(null); setUploadName(''); setUploadEmoji('🎵'); setUploadDesc(''); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200"
              style={{ background: 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.98) 50%, rgba(248,246,243,0.98) 100%)' }}
            >
              <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-[80px]" style={{ background: 'rgba(168,85,247,0.12)' }} />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full blur-[60px]" style={{ background: 'rgba(56,189,248,0.06)' }} />

              <div className="relative px-7 pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 tracking-tight" style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}>添加本地音乐</h3>
                    <p className="text-[11px] text-gray-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>上传音频文件，创建专属背景音乐</p>
                  </div>
                  <button onClick={() => { setShowUpload(false); setUploadPreview(null); setUploadName(''); setUploadEmoji('🎵'); setUploadDesc(''); }} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="relative px-7 py-4">
                {!uploadPreview ? (
                  <motion.button
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.35 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 transition-all duration-300 hover:border-purple-300 hover:bg-purple-50/50"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 transition-all duration-300 group-hover:border-purple-300 group-hover:bg-purple-50">
                      <MusicIcon size={22} className="text-gray-400 transition-colors group-hover:text-purple-400/70" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">点击选择音频文件</p>
                      <p className="text-[11px] text-gray-300 mt-1.5">支持 MP3、WAV、OGG 格式</p>
                    </div>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
                        <motion.span initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="text-2xl">🎵</motion.span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate font-medium">{uploadFileName}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">音频文件已就绪</p>
                      </div>
                      <button
                        onClick={() => { setUploadPreview(null); setUploadFileName(''); setUploadName(''); }}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="relative px-7 pb-2">
                <label className="text-[11px] font-medium text-gray-400 mb-2 block tracking-wide">选择图标</label>
                <div className="flex flex-wrap gap-2">
                  {['🎵', '🎶', '🎸', '🎹', '🎷', '🥁', '🎻', '🎺', '🌊', '🌧️', '🔥', '💨'].map((em, i) => (
                    <motion.button
                      key={em}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.18 + i * 0.025, type: 'spring', stiffness: 400, damping: 22 }}
                      onClick={() => setUploadEmoji(em)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-base transition-all duration-200 ${
                        uploadEmoji === em
                          ? 'border border-purple-300 bg-purple-50 scale-110 shadow-lg shadow-purple-200/50'
                          : 'border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {em}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }} className="relative px-7 py-4 flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-medium text-gray-400 mb-1.5 block tracking-wide">音乐名称</label>
                  <input
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 outline-none transition-all focus:border-purple-300 focus:bg-white focus:ring-1 focus:ring-purple-200"
                    placeholder="给你的音乐起个名字"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-400 mb-1.5 block tracking-wide">描述 <span className="text-gray-300">（可选）</span></label>
                  <input
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 outline-none transition-all focus:border-purple-300 focus:bg-white focus:ring-1 focus:ring-purple-200"
                    placeholder="简单描述一下这首音乐"
                  />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }} className="relative px-7 pb-7 pt-2">
                <button
                  onClick={() => {
                    if (uploadName.trim() && uploadPreview) {
                      const newItem = {
                        name: uploadName.trim(),
                        emoji: uploadEmoji || '🎵',
                        description: uploadDesc || '本地音乐',
                        category: 'light' as const,
                        url: uploadPreview,
                      };

                      const modalCenterX = window.innerWidth / 2;
                      const modalCenterY = window.innerHeight / 2;
                      const ind = indicatorRef.current;
                      let endX = window.innerWidth * 0.35;
                      let endY = window.innerHeight / 2;
                      if (ind) {
                        const rect = ind.getBoundingClientRect();
                        endX = rect.left + rect.width / 2;
                        endY = rect.top + rect.height / 2;
                      }

                      setFlyingItem({
                        emoji: newItem.emoji,
                        name: newItem.name,
                        startX: modalCenterX,
                        startY: modalCenterY,
                        endX,
                        endY,
                      });

                      setShowUpload(false);
                      setUploadPreview(null);
                      setUploadFileName('');
                      setUploadName('');
                      setUploadEmoji('🎵');
                      setUploadDesc('');

                      addCustomMusic(newItem);

                      requestAnimationFrame(() => {
                        const newTotal = filtered.length + 1;
                        const targetAngle = -(newTotal - 1) * (360 / newTotal);
                        const cur = motionAngle.get();
                        const wraps = Math.round((cur - targetAngle) / 360);
                        snapTo(targetAngle + wraps * 360);

                        const el = flyRef.current;
                        if (el) {
                          if (flyAnimRef.current) flyAnimRef.current.stop();
                          flyAnimRef.current = animate(0, 1, {
                            duration: 0.55,
                            ease: [0.22, 1, 0.36, 1],
                            onUpdate: (p) => {
                              const x = modalCenterX + (endX - modalCenterX) * p - 80;
                              const y = modalCenterY + (endY - modalCenterY) * p - 24;
                              const s = 1 - p * 0.4;
                              el.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
                              el.style.opacity = String(1 - p * 0.3);
                            },
                            onComplete: () => {
                              setFlyingItem(null);
                            },
                          });
                        }
                      });
                    }
                  }}
                  disabled={!uploadName.trim() || !uploadPreview}
                  className="w-full rounded-xl py-3 text-sm font-medium text-gray-700 transition-all duration-300 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: uploadName.trim() && uploadPreview
                      ? 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(196,181,253,0.2) 100%)'
                      : 'rgba(229,231,235,0.5)',
                    border: uploadName.trim() && uploadPreview
                      ? '1px solid rgba(168,85,247,0.2)'
                      : '1px solid rgba(209,213,219,0.5)',
                    boxShadow: uploadName.trim() && uploadPreview
                      ? '0 4px 24px rgba(168,85,247,0.08)'
                      : 'none',
                  }}
                >
                  {uploadName.trim() && uploadPreview ? '✦ 添加到轮盘' : '请填写信息'}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {flyingItem && (
        <div
          ref={flyRef}
          className="pointer-events-none fixed z-[100] flex items-center gap-3 rounded-xl border border-gray-200 bg-white/90 px-4 py-2.5 shadow-2xl backdrop-blur-md"
          style={{
            left: 0, top: 0, width: 200, height: 52,
            transform: `translate3d(${flyingItem.startX - 80}px,${flyingItem.startY - 24}px,0) scale(1)`,
            opacity: 1,
          }}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
            <span className="text-base">{flyingItem.emoji}</span>
          </div>
          <span className="text-sm text-gray-600 truncate">{flyingItem.name}</span>
        </div>
      )}
    </div>
  );
}
