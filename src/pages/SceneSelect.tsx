import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, animate, useMotionValueEvent } from 'framer-motion';
import { scenes, type Scene } from '@/data/scenes';
import { useStore } from '@/store/useStore';
import { ArrowLeft, LogIn, Heart, Plus, X, Trash2 } from 'lucide-react';

const RADIUS = 380;
const VISIBLE_ARC = 120;
const CX = 180;
const ITEM_W = 320;

function normAngle(d: number): number {
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

export default function SceneSelect() {
  const navigate = useNavigate();
  const setScene = useStore((s) => s.setScene);
  const user = useStore((s) => s.user);
  const favoriteScenes = useStore((s) => s.favoriteScenes);
  const toggleFavoriteScene = useStore((s) => s.toggleFavoriteScene);
  const customScenes = useStore((s) => s.customScenes);
  const addCustomScene = useStore((s) => s.addCustomScene);
  const removeCustomScene = useStore((s) => s.removeCustomScene);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadEmoji, setUploadEmoji] = useState('🎨');
  const [uploadDesc, setUploadDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [flyingItem, setFlyingItem] = useState<{ emoji: string; name: string; image?: string; startX: number; startY: number; endX: number; endY: number } | null>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const flyAnimRef = useRef<ReturnType<typeof animate> | null>(null);

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

  const total = allScenes.length;
  const angleStep = 360 / total;

  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);
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

  const updateItems = useCallback((v: number) => {
    let best = 0;
    let bestDist = 999;
    const half = VISIBLE_ARC / 2;
    const cy = CY.current;
    const curTotal = allScenes.length;
    const curStep = curTotal > 0 ? 360 / curTotal : 360;

    for (let i = 0; i < curTotal; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const ea = normAngle(i * curStep + v);
      const rad = (ea * Math.PI) / 180;
      const x = CX + RADIUS * Math.cos(rad) - ITEM_W / 2;
      const y = cy - RADIUS * Math.sin(rad) - 40;
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
      const ea0 = normAngle(best * curStep + v);
      const rad0 = (ea0 * Math.PI) / 180;
      ind.style.transform = `translate3d(${CX + RADIUS * Math.cos(rad0) - ITEM_W / 2 - 8}px,${cy - RADIUS * Math.sin(rad0) - 40 + 10}px,0)`;
      ind.style.opacity = '1';
    }

    if (best !== activeRef.current) {
      activeRef.current = best;
      setActiveIndex(best);
    }
  }, [allScenes.length]);

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
  const activeScene = allScenes[displayIdx] ?? allScenes[0];

  const snapTo = useCallback((target: number) => {
    if (animRef.current) animRef.current.stop();
    animRef.current = animate(motionAngle, target, {
      type: 'spring', stiffness: 300, damping: 28, mass: 0.6,
    });
  }, [motionAngle]);

  const snapToItem = useCallback((itemIdx: number) => {
    const cur = motionAngle.get();
    const step = allScenes.length > 0 ? 360 / allScenes.length : 360;
    const base = -itemIdx * step;
    const wraps = Math.round((cur - base) / 360);
    snapTo(base + wraps * 360);
  }, [motionAngle, snapTo, allScenes.length]);

  useEffect(() => { snapTo(0); }, [snapTo]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const step = allScenes.length > 0 ? 360 / allScenes.length : 360;
    snapTo(motionAngle.get() + (e.deltaY > 0 ? -1 : 1) * step);
  }, [motionAngle, snapTo, allScenes.length]);

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
    const step = allScenes.length > 0 ? 360 / allScenes.length : 360;
    const proj = motionAngle.get() + vel.current * 3;
    snapTo(Math.round(proj / step) * step);
  }, [motionAngle, snapTo, allScenes.length]);

  const handleSelect = (id: string) => { setScene(id); navigate('/room'); };

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
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center gap-5 px-8 pt-6 pb-3">
        <Link to="/" className="group flex items-center gap-2 text-gray-400 transition-colors hover:text-gray-600">
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs tracking-wide">返回</span>
        </Link>
        <div className="h-3 w-px bg-gray-200" />
        <span className="text-[11px] font-light tracking-[0.2em] text-gray-300 uppercase" style={{ fontFamily: "'DM Sans', sans-serif" }}>选择学习场景</span>
        {user ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowUpload(true); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="group flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white/60 text-gray-400 transition-all hover:bg-white hover:text-gray-600 hover:border-amber-300 hover:shadow-[0_0_12px_rgba(212,165,116,0.15)]"
          >
            <Plus size={14} className="transition-transform group-hover:rotate-90 duration-300" />
          </button>
        ) : (
          <Link to="/profile" className="text-[11px] text-gray-300 transition-colors hover:text-gray-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            登录后可自定义添加
          </Link>
        )}
      </header>

      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 40% 50%, rgba(212,165,116,0.05) 0%, transparent 100%)' }} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative z-10 flex h-full flex-col pt-14">

        <motion.div
          className="pointer-events-none absolute left-0 top-14 bottom-0 w-[40%]"
          animate={{
            scale: hoveredSide === 'left' ? 1.18 : hoveredSide === 'right' ? 0.88 : 1,
            x: hoveredSide === 'left' ? '12%' : hoveredSide === 'right' ? '-8%' : 0,
            opacity: hoveredSide === 'right' ? 0.5 : 1,
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setHoveredSide('left')}
          onMouseLeave={() => setHoveredSide(null)}
          style={{ transformOrigin: '50% 50%' }}
        >
          <svg width={svgW} height={svgH} className="absolute" style={{ left: 0, top: '50%', transform: 'translateY(-50%)' }}>
            <defs>
              <mask id="sector-mask-scene">
                <rect x="0" y="0" width={svgW} height={svgH} fill="black" />
                <path d={(() => {
                  const r = RADIUS + 60;
                  const s = ((-VISIBLE_ARC / 2) * Math.PI) / 180;
                  const e = ((VISIBLE_ARC / 2) * Math.PI) / 180;
                  return `M ${CX} ${CY.current} L ${CX + r * Math.cos(s)} ${CY.current - r * Math.sin(s)} A ${r} ${r} 0 0 1 ${CX + r * Math.cos(e)} ${CY.current - r * Math.sin(e)} Z`;
                })()} fill="white" />
              </mask>
            </defs>
            <circle cx={CX} cy={CY.current} r={RADIUS} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" strokeDasharray="4 8" mask="url(#sector-mask-scene)" />
            {[-45, -30, -15, 0, 15, 30, 45].map((a) => {
              const rad = (a * Math.PI) / 180;
              return <line key={a} x1={CX + 80 * Math.cos(rad)} y1={CY.current - 80 * Math.sin(rad)} x2={CX + (RADIUS + 30) * Math.cos(rad)} y2={CY.current - (RADIUS + 30) * Math.sin(rad)} stroke={a === 0 ? 'rgba(212,165,116,0.15)' : 'rgba(0,0,0,0.03)'} strokeWidth="1" strokeDasharray={a === 0 ? '4 6' : '2 6'} mask="url(#sector-mask-scene)" />;
            })}
            {[100, 200, 300].map((r) => (
              <circle key={r} cx={CX} cy={CY.current} r={r} fill="none" stroke="rgba(0,0,0,0.025)" strokeWidth="1" mask="url(#sector-mask-scene)" />
            ))}
          </svg>

          <div className="pointer-events-none absolute" style={{ left: CX - 5, top: CY.current - 5, width: 10, height: 10, borderRadius: '50%', background: 'rgba(212,165,116,0.4)', boxShadow: '0 0 20px rgba(212,165,116,0.25), 0 0 60px rgba(212,165,116,0.08)' }} />

          <div ref={indicatorRef} className="pointer-events-none absolute" style={{ left: 0, top: 0, width: 3, height: 64, borderRadius: 2, background: 'linear-gradient(to bottom, rgba(212,165,116,0.9), rgba(212,165,116,0.1))', opacity: 0, willChange: 'transform' }} />

          <div className="pointer-events-auto absolute inset-0" onMouseEnter={() => setHoveredSide('left')} onMouseLeave={() => setHoveredSide(null)}>
            {allScenes.map((scene, index) => {
              const isCustom = customScenes.some(cs => cs.id === scene.id);
              return (
              <button
                key={scene.id}
                ref={(el) => { itemRefs.current[index] = el; }}
                className="absolute flex items-center gap-4 rounded-2xl px-7 py-4 hover:bg-black/[0.03]"
                style={{
                  left: 0, top: 0, width: ITEM_W, willChange: 'transform,opacity', opacity: 0,
                  transition: 'opacity 0.25s ease-out',
                }}
                onClick={() => {
                  if (index === displayIdx) handleSelect(scene.id);
                  else snapToItem(index);
                }}
              >
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${index === displayIdx ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}`}>
                  <span className="text-xl">{scene.emoji}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className={`text-[15px] truncate transition-colors duration-300 ${index === displayIdx ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>{scene.name}</p>
                  <p className={`text-[12px] truncate mt-0.5 transition-colors duration-300 ${index === displayIdx ? 'text-gray-500' : 'text-gray-300'}`}>{scene.description}</p>
                </div>
                {isCustom && user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomScene(scene.id);
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
          <div className="flex flex-col items-center gap-5 w-full max-w-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScene.id}
                initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -16, scale: 0.95, filter: 'blur(6px)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.8 }}
                className="text-center"
              >
                <motion.span
                  className="text-6xl inline-block"
                  initial={{ scale: 0.6, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
                >{activeScene.emoji}</motion.span>
                <div className="flex items-center justify-center gap-2 mt-5">
                  <motion.h2
                    className="text-2xl font-semibold text-gray-800 tracking-tight"
                    style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08, duration: 0.3 }}
                  >{activeScene.name}</motion.h2>
                  {user && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 }}
                      onClick={(e) => { e.stopPropagation(); toggleFavoriteScene(activeScene.id); }}
                      className="transition-colors"
                    >
                      <Heart size={18} className={favoriteScenes.includes(activeScene.id) ? 'text-pink-400' : 'text-gray-300 hover:text-gray-400'} fill={favoriteScenes.includes(activeScene.id) ? 'currentColor' : 'none'} />
                    </motion.button>
                  )}
                  {user && customScenes.some(cs => cs.id === activeScene.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomScene(activeScene.id);
                      }}
                      className="transition-colors text-gray-300 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <motion.p
                  className="text-sm text-gray-400 mt-3 max-w-sm leading-relaxed mx-auto"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.3 }}
                >{activeScene.description}</motion.p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-1.5">
              {allScenes.map((_, i) => (
                <button key={i} onClick={() => snapToItem(i)} className="transition-all duration-300">
                  <div className={`rounded-full transition-all duration-300 ${i === displayIdx ? 'h-1.5 w-6 bg-amber-400/60' : 'h-1.5 w-1.5 bg-gray-200 hover:bg-gray-300'}`} />
                </button>
              ))}
            </div>

            <motion.button
              onClick={() => handleSelect(activeScene.id)}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-2.5 rounded-xl border border-amber-200/60 px-10 py-4 text-sm font-medium text-gray-600 backdrop-blur-sm transition-colors hover:border-amber-300 hover:text-gray-800 hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, rgba(212,165,116,0.15) 0%, rgba(255,248,240,0.8) 100%)' }}
            >
              <LogIn size={15} />
              <span style={{ fontFamily: "'DM Sans', sans-serif" }}>进入「{activeScene.name}」</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            setUploadPreview(ev.target?.result as string);
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
            onClick={() => { setShowUpload(false); setUploadPreview(null); setUploadName(''); setUploadEmoji('🎨'); setUploadDesc(''); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/40"
              style={{ background: 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(250,248,245,0.98) 50%, rgba(248,245,240,0.95) 100%)' }}
            >
              <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-[80px]" style={{ background: 'rgba(212,165,116,0.15)' }} />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full blur-[60px]" style={{ background: 'rgba(180,140,80,0.08)' }} />

              <div className="relative px-7 pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 tracking-tight" style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}>创建自定义场景</h3>
                    <p className="text-[11px] text-gray-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>上传图片，打造你的专属学习空间</p>
                  </div>
                  <button onClick={() => { setShowUpload(false); setUploadPreview(null); setUploadName(''); setUploadEmoji('🎨'); setUploadDesc(''); }} className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600">
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
                    className="group flex w-full flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 transition-all duration-300 hover:border-amber-300 hover:bg-amber-50/30"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 transition-all duration-300 group-hover:border-amber-200 group-hover:bg-amber-50">
                      <Plus size={22} className="text-gray-300 transition-colors group-hover:text-amber-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">点击选择场景图片</p>
                      <p className="text-[11px] text-gray-300 mt-1.5">支持 JPG、PNG、WebP 格式</p>
                    </div>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative overflow-hidden rounded-2xl border border-gray-200"
                  >
                    <img src={uploadPreview} alt="preview" className="h-44 w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <button
                      onClick={() => { setUploadPreview(null); setUploadName(''); }}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/60 text-gray-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-700"
                    >
                      <X size={13} />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/60 px-3 py-1.5 text-[11px] text-gray-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-700"
                    >
                      更换图片
                    </button>
                  </motion.div>
                )}
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }} className="relative px-7 pb-2">
                <label className="text-[11px] font-medium text-gray-400 mb-2 block tracking-wide">选择图标</label>
                <div className="flex flex-wrap gap-2">
                  {['🎨', '🏔️', '🌊', '🌅', '🌙', '⭐', '🌸', '🏡', '📖', '🎓', '✨', '🔥'].map((em, i) => (
                    <motion.button
                      key={em}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.18 + i * 0.025, type: 'spring', stiffness: 400, damping: 22 }}
                      onClick={() => setUploadEmoji(em)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-base transition-all duration-200 ${
                        uploadEmoji === em
                          ? 'border border-amber-300 bg-amber-50 scale-110 shadow-lg shadow-amber-100'
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
                  <label className="text-[11px] font-medium text-gray-400 mb-1.5 block tracking-wide">场景名称</label>
                  <input
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 outline-none transition-all focus:border-amber-300 focus:bg-white focus:ring-1 focus:ring-amber-100"
                    placeholder="给你的场景起个名字"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-400 mb-1.5 block tracking-wide">描述 <span className="text-gray-300">（可选）</span></label>
                  <input
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 outline-none transition-all focus:border-amber-300 focus:bg-white focus:ring-1 focus:ring-amber-100"
                    placeholder="简单描述一下这个场景"
                  />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }} className="relative px-7 pb-7 pt-2">
                <button
                  onClick={() => {
                    if (uploadName.trim() && uploadPreview) {
                      const newItem = {
                        name: uploadName.trim(),
                        emoji: uploadEmoji || '🎨',
                        description: uploadDesc || '自定义场景',
                        image: uploadPreview,
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
                        image: newItem.image,
                        startX: modalCenterX,
                        startY: modalCenterY,
                        endX,
                        endY,
                      });

                      setShowUpload(false);
                      setUploadPreview(null);
                      setUploadName('');
                      setUploadEmoji('🎨');
                      setUploadDesc('');

                      addCustomScene(newItem);

                      requestAnimationFrame(() => {
                        const newTotal = allScenes.length + 1;
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
                              const y = modalCenterY + (endY - modalCenterY) * p - 32;
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
                  className="w-full rounded-xl py-3 text-sm font-medium transition-all duration-300 hover:brightness-105 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: uploadName.trim() && uploadPreview
                      ? 'linear-gradient(135deg, rgba(212,165,116,0.4) 0%, rgba(180,120,60,0.25) 100%)'
                      : 'rgba(0,0,0,0.04)',
                    color: uploadName.trim() && uploadPreview ? '#4a3520' : '#999',
                    border: uploadName.trim() && uploadPreview
                      ? '1px solid rgba(212,165,116,0.3)'
                      : '1px solid rgba(0,0,0,0.06)',
                    boxShadow: uploadName.trim() && uploadPreview
                      ? '0 4px 24px rgba(212,165,116,0.12), inset 0 1px 0 rgba(255,255,255,0.05)'
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
          className="pointer-events-none fixed z-[100] flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 px-5 py-3 shadow-2xl backdrop-blur-md"
          style={{
            left: 0, top: 0, width: 220, height: 64,
            transform: `translate3d(${flyingItem.startX - 80}px,${flyingItem.startY - 32}px,0) scale(1)`,
            opacity: 1,
          }}
        >
          {flyingItem.image ? (
            <img src={flyingItem.image} alt="" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
              <span className="text-lg">{flyingItem.emoji}</span>
            </div>
          )}
          <span className="text-sm text-gray-600 truncate">{flyingItem.name}</span>
        </div>
      )}
    </div>
  );
}
