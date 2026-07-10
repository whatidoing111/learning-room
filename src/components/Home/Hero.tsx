import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextType from './TextType';
import ShinyText from './ShinyText';

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: 'url(https://picsum.photos/1920/1080?random=1)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(212,165,116,0.08) 0%, transparent 70%)',
      }} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + Math.random() * 4,
              height: 3 + Math.random() * 4,
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: `rgba(212,165,116,${0.15 + Math.random() * 0.15})`,
              boxShadow: '0 0 12px rgba(212,165,116,0.2)',
              animation: `particle-float ${5 + i * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <span className="glow-badge">
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-5 py-1.5 text-[11px] font-light tracking-[0.25em] text-white/50 uppercase backdrop-blur-md" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Your Study Space
            </span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-8xl"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", textWrap: 'balance' }}
        >
          <TextType
            text={["你的专属学习空间", "沉浸式专注体验", "让学习更有仪式感"]}
            typingSpeed={150}
            pauseDuration={3000}
            showCursor={true}
            cursorCharacter="|"
            textColors={["#ffffff", "#d4a574", "#e8c4b8"]}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mb-8 h-px w-24"
          style={{ background: 'linear-gradient(to right, transparent, rgba(212,165,116,0.5), transparent)' }}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-12 max-w-lg text-base md:text-lg leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <ShinyText
            text="选择场景，播放音乐，专注学习"
            speed={2}
            delay={1}
            color="rgba(255,255,255,0.5)"
            shineColors={['#d4a574', '#7c3aed', '#38bdf8', '#f472b6', '#34d399']}
            spread={120}
            direction="left"
          />
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center gap-4"
        >
          <Link
            to="/scenes"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-10 py-4 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(212,165,116,0.25) 0%, rgba(180,120,60,0.15) 100%)',
              border: '1px solid rgba(212,165,116,0.2)',
            }}
          >
            <span className="relative z-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>开始学习</span>
            <svg className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{
              background: 'linear-gradient(135deg, rgba(212,165,116,0.35) 0%, rgba(180,120,60,0.25) 100%)',
            }} />
            <div className="pointer-events-none absolute -inset-px rounded-full" style={{
              animation: 'hero-breathe 3s ease-in-out infinite',
              boxShadow: '0 0 30px rgba(212,165,116,0.15)',
            }} />
          </Link>

          <Link
            to="/room"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 text-sm font-medium text-white/60 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:text-white/90"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            直接进入
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] text-white/20 uppercase" style={{ fontFamily: "'DM Sans', sans-serif" }}>Scroll</span>
            <div className="h-8 w-px animate-pulse" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }} />
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes particle-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.3); opacity: 0.8; }
        }
        @keyframes hero-breathe {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        @keyframes glow-edge {
          0%, 100% {
            box-shadow:
              0 0 6px 1px rgba(255,245,230,0.25),
              0 0 14px 3px rgba(255,235,210,0.12),
              0 0 28px 6px rgba(255,245,230,0.06);
          }
          33% {
            box-shadow:
              0 0 6px 1px rgba(255,240,225,0.35),
              0 0 14px 3px rgba(255,248,240,0.18),
              0 0 28px 6px rgba(255,240,225,0.08);
          }
          66% {
            box-shadow:
              0 0 6px 1px rgba(255,250,245,0.3),
              0 0 14px 3px rgba(255,245,235,0.15),
              0 0 28px 6px rgba(255,250,245,0.07);
          }
        }
        .glow-badge {
          display: inline-block;
          border-radius: 9999px;
          animation: glow-edge 2.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
