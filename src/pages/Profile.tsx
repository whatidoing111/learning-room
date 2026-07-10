import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { scenes } from '@/data/scenes';
import { musicList } from '@/data/music';
import { ArrowLeft, User, LogOut, Clock, Heart, Music, Trash2 } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, login, logout, studyMinutes, pomodoroCount, favoriteScenes, favoriteMusic, studyHistory, customScenes, customMusic, removeCustomScene, removeCustomMusic, toggleFavoriteScene, toggleFavoriteMusic } = useStore();
  const [username, setUsername] = useState('');

  const handleLogin = () => {
    if (username.trim()) {
      login(username.trim());
      setUsername('');
    }
  };

  const totalSessions = studyHistory.length;
  const totalMinutes = studyMinutes + studyHistory.reduce((acc, s) => acc + s.duration, 0);

  const favSceneItems = scenes.filter((s) => favoriteScenes.includes(s.id));
  const favMusicItems = musicList.filter((m) => favoriteMusic.includes(m.id));

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #2d2d3f 30%, #4a4a5a 60%, #6b6b7b 100%)' }}>
        <header className="flex items-center gap-4 px-8 pt-6 pb-3">
          <Link to="/" className="group flex items-center gap-2 text-white/40 transition-colors hover:text-white/70">
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="text-xs tracking-wide">返回</span>
          </Link>
        </header>
        <div className="flex h-[80vh] items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
                <User size={28} className="text-white/40" />
              </div>
              <h1 className="text-xl font-bold text-white">登录学习室</h1>
              <p className="mt-1 text-sm text-white/40">输入昵称即可开始</p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="你的昵称"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors"
              />
              <button onClick={handleLogin} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15 active:scale-[0.98]">
                进入学习室
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #2d2d3f 30%, #4a4a5a 60%, #6b6b7b 100%)' }}>
      <header className="flex items-center justify-between px-8 pt-6 pb-3">
        <Link to="/" className="group flex items-center gap-2 text-white/40 transition-colors hover:text-white/70">
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="text-xs tracking-wide">返回</span>
        </Link>
        <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white/60">
          <LogOut size={13} />
          <span>退出</span>
        </button>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-center gap-5">
          <img src={user.avatar} alt={user.username} className="h-16 w-16 rounded-full border border-white/10 bg-white/5" />
          <div>
            <h1 className="text-2xl font-bold text-white">{user.username}</h1>
            <p className="text-xs text-white/40">加入于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: '累计学习', value: `${totalMinutes} 分钟`, icon: <Clock size={16} /> },
            { label: '番茄钟数', value: `${pomodoroCount} 个`, icon: <span className="text-sm">🍅</span> },
            { label: '学习次数', value: `${totalSessions} 次`, icon: <span className="text-sm">📚</span> },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <div className="text-white/30">{stat.icon}</div>
              <span className="text-lg font-semibold text-white">{stat.value}</span>
              <span className="text-[11px] text-white/40">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Heart size={14} className="text-pink-400/60" />
              收藏场景
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {favSceneItems.length === 0 && customScenes.length === 0 && <p className="text-xs text-white/30">暂无收藏，在场景页面点击心形图标收藏</p>}
            {favSceneItems.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <span>{s.emoji}</span>
                <span className="text-xs text-white/70">{s.name}</span>
                <button onClick={() => toggleFavoriteScene(s.id)} className="text-pink-400 hover:text-pink-300"><Heart size={11} fill="currentColor" /></button>
              </div>
            ))}
            {customScenes.map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <span>{s.emoji}</span>
                <span className="text-xs text-white/70">{s.name}</span>
                <button onClick={() => removeCustomScene(s.id)} className="text-white/20 hover:text-red-400"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Music size={14} className="text-violet-400/60" />
              收藏音乐
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {favMusicItems.length === 0 && customMusic.length === 0 && <p className="text-xs text-white/30">暂无收藏，在音乐页面点击心形图标收藏</p>}
            {favMusicItems.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <span>{m.emoji}</span>
                <span className="text-xs text-white/70">{m.name}</span>
                <button onClick={() => toggleFavoriteMusic(m.id)} className="text-pink-400 hover:text-pink-300"><Heart size={11} fill="currentColor" /></button>
              </div>
            ))}
            {customMusic.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <span>{m.emoji}</span>
                <span className="text-xs text-white/70">{m.name}</span>
                <button onClick={() => removeCustomMusic(m.id)} className="text-white/20 hover:text-red-400"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
            <Clock size={14} className="text-amber-400/60" />
            最近学习记录
          </h2>
          {studyHistory.length === 0 ? (
            <p className="text-xs text-white/30">暂无学习记录，开始你的第一次学习吧</p>
          ) : (
            <div className="flex flex-col gap-2">
              {studyHistory.slice(-5).reverse().map((s) => {
                const sc = scenes.find((sc) => sc.id === s.sceneId);
                const mu = musicList.find((m) => m.id === s.musicId);
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{sc?.emoji ?? '📚'}</span>
                      <div>
                        <p className="text-xs text-white/70">{sc?.name ?? '未知场景'}</p>
                        <p className="text-[10px] text-white/30">{mu?.emoji} {mu?.name ?? '未知音乐'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/60">{s.duration} 分钟</p>
                      <p className="text-[10px] text-white/30">{new Date(s.date).toLocaleDateString('zh-CN')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
