import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, type ExternalTrack } from '@/store/useStore';
import { musicList } from '@/data/music';
import { Play, Pause, Volume2, VolumeX, ChevronDown, Globe, Music, Search, X, ChevronLeft, ListMusic, User, LogOut, Loader2, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ElasticSlider from './ElasticSlider';

const API_BASE = 'http://localhost:3000/api';

interface NeteasePlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  playCount: number;
}

interface NeteaseTrack {
  id: number;
  name: string;
  ar: { id: number; name: string }[];
  al: { id: number; name: string; picUrl?: string };
  dt: number;
}

interface NeteaseLyric {
  time: number;
  text: string;
}

interface NeteaseUser {
  userId: number;
  nickname: string;
  avatarUrl: string;
}

type PlatformView = 'select' | 'login' | 'dashboard';
type DashboardTab = 'playlists' | 'playlist-tracks' | 'search' | 'playing';

export default function MusicPlayer() {
  const selectedMusic = useStore((s) => s.selectedMusic);
  const volume = useStore((s) => s.volume);
  const isPlaying = useStore((s) => s.isPlaying);
  const externalVolume = useStore((s) => s.externalVolume);
  const externalPlaying = useStore((s) => s.externalPlaying);
  const currentExternal = useStore((s) => s.currentExternal);
  const customMusicList = useStore((s) => s.customMusic);
  const setVolume = useStore((s) => s.setVolume);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const setExternalVolume = useStore((s) => s.setExternalVolume);
  const setExternalPlaying = useStore((s) => s.setExternalPlaying);
  const setCurrentExternal = useStore((s) => s.setCurrentExternal);
  const setMusic = useStore((s) => s.setMusic);

  const [activeTab, setActiveTab] = useState<'builtin' | 'external'>('builtin');
  const [showList, setShowList] = useState(false);
  const builtinAudioRef = useRef<HTMLAudioElement | null>(null);
  const externalAudioRef = useRef<HTMLAudioElement | null>(null);

  const [activeMusicPlatform, setActiveMusicPlatform] = useState<'netease' | 'qq' | null>(null);
  const [platformView, setPlatformView] = useState<PlatformView>('select');
  const [neteaseUser, setNeteaseUser] = useState<NeteaseUser | null>(null);
  const [qrImg, setQrImg] = useState<string>('');
  const [qrStatus, setQrStatus] = useState<string>('');
  const [qrKey, setQrKey] = useState<string>('');
  const [playlists, setPlaylists] = useState<NeteasePlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<NeteasePlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<NeteaseTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NeteaseTrack[]>([]);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('playlists');
  const [currentTrack, setCurrentTrack] = useState<NeteaseTrack | null>(null);
  const [trackUrl, setTrackUrl] = useState<string>('');
  const [lyrics, setLyrics] = useState<NeteaseLyric[]>([]);
  const [currentLyricIdx, setCurrentLyricIdx] = useState(-1);
  const [playProgress, setPlayProgress] = useState(0);
  const [playDuration, setPlayDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [trackList, setTrackList] = useState<NeteaseTrack[]>([]);
  const [qqSearchResults, setQqSearchResults] = useState<NeteaseTrack[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [qqQrImg, setQqQrImg] = useState<string>('');
  const [qqQrStatus, setQqQrStatus] = useState<string>('');
  const [qqQrsig, setQqQrsig] = useState<string>('');
  const [qqUser, setQqUser] = useState<{ nickname: string; avatarUrl: string; qqNum: string } | null>(null);
  const prevVolumeRef = useRef(externalVolume);
  const progressRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qqPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const customMusicItem = customMusicList.find((m) => m.id === selectedMusic);
  const builtinMusic = musicList.find((m) => m.id === selectedMusic);
  const currentMusic = customMusicItem
    ? { name: customMusicItem.name, emoji: customMusicItem.emoji, description: customMusicItem.description }
    : builtinMusic;
  const displayName = currentMusic?.name ?? '未选择';
  const displayEmoji = currentMusic?.emoji ?? '🎵';
  const isCustomWithAudio = !!customMusicItem?.url;
  const isBuiltinWithAudio = !!builtinMusic?.url;
  const localAudioUrl = customMusicItem?.url || builtinMusic?.url;
  const hasLocalAudio = isCustomWithAudio || isBuiltinWithAudio;

  useEffect(() => {
    if (hasLocalAudio && localAudioUrl) {
      if (!builtinAudioRef.current) {
        builtinAudioRef.current = new Audio();
        builtinAudioRef.current.loop = true;
      }
      const audio = builtinAudioRef.current;
      const fullUrl = new URL(localAudioUrl, window.location.origin).href;
      if (audio.src !== fullUrl) audio.src = fullUrl;
      audio.volume = volume / 100;
      isPlaying ? audio.play().catch(() => {}) : audio.pause();
    } else {
      if (builtinAudioRef.current) { builtinAudioRef.current.pause(); builtinAudioRef.current = null; }
    }
    return () => { if (builtinAudioRef.current && !hasLocalAudio) { builtinAudioRef.current.pause(); builtinAudioRef.current = null; } };
  }, [hasLocalAudio, localAudioUrl, isPlaying]);

  useEffect(() => { if (builtinAudioRef.current) builtinAudioRef.current.volume = volume / 100; }, [volume]);

  const checkLoginStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/login/status`);
      const data = await res.json();
      if (data.account && data.profile) {
        setNeteaseUser({ userId: data.profile.userId, nickname: data.profile.nickname, avatarUrl: data.profile.avatarUrl });
        setPlatformView('dashboard');
        loadPlaylists(data.profile.userId);
      }
    } catch {}
  }, []);

  useEffect(() => { checkLoginStatus(); }, [checkLoginStatus]);

  const startQrLogin = async () => {
    try {
      setLoading(true);
      setQrStatus('获取二维码...');
      const keyRes = await fetch(`${API_BASE}/qr/key`);
      const keyData = await keyRes.json();
      const key = keyData.data.unikey;
      setQrKey(key);

      const createRes = await fetch(`${API_BASE}/qr/create?key=${key}&qrimg=true`);
      const createData = await createRes.json();
      setQrImg(createData.data.qrimg);
      setQrStatus('请使用网易云音乐 APP 扫码登录');

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(`${API_BASE}/qr/check?key=${key}`);
          const checkData = await checkRes.json();
          if (checkData.code === 803) {
            setQrStatus('登录成功！');
            if (pollRef.current) clearInterval(pollRef.current);
            checkLoginStatus();
          } else if (checkData.code === 800) {
            setQrStatus('二维码已过期，点击重新获取');
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (checkData.code === 801) {
            setQrStatus('等待扫码...');
          } else if (checkData.code === 802) {
            setQrStatus('已扫码，等待确认...');
          }
        } catch {}
      }, 2000);
    } catch (err) {
      setQrStatus('获取二维码失败，请确保后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  const startQqQrLogin = async () => {
    try {
      setLoading(true);
      setQqQrStatus('获取二维码...');
      const res = await fetch(`${API_BASE}/qq/qr/show`);
      const data = await res.json();
      if (data.code === 0) {
        setQqQrImg(`data:image/png;base64,${data.img}`);
        setQqQrsig(data.qrsig);
        setQqQrStatus('请使用 QQ 扫码登录');

        if (qqPollRef.current) clearInterval(qqPollRef.current);
        qqPollRef.current = setInterval(async () => {
          try {
            const checkRes = await fetch(`${API_BASE}/qq/qr/check?qrsig=${encodeURIComponent(data.qrsig)}`);
            const checkData = await checkRes.json();
            if (checkData.code === 803) {
              setQqQrStatus('登录成功！');
              if (qqPollRef.current) clearInterval(qqPollRef.current);
              const qqNum = checkData.qqNum || '';
              const nickname = checkData.nickname || `QQ${qqNum}`;
              const avatarUrl = qqNum ? `https://q.qlogo.cn/headimg_dl?dst_uin=${qqNum}&spec=100&img_type=jpg` : '';
              setQqUser({ nickname, avatarUrl, qqNum });
              setPlatformView('dashboard');
              setDashboardTab('playlists');
              loadQqPlaylists();
            } else if (checkData.code === 800) {
              setQqQrStatus('二维码已过期，点击重新获取');
              if (qqPollRef.current) clearInterval(qqPollRef.current);
            } else if (checkData.code === 801) {
              setQqQrStatus('等待扫码...');
            } else if (checkData.code === 802) {
              setQqQrStatus('已扫码，等待确认...');
            }
          } catch {}
        }, 2000);
      } else {
        setQqQrStatus('获取二维码失败');
      }
    } catch {
      setQqQrStatus('获取二维码失败，请确保后端服务已启动');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); if (qqPollRef.current) clearInterval(qqPollRef.current); };
  }, []);

  const loadPlaylists = async (uid: number) => {
    try {
      const res = await fetch(`${API_BASE}/user/playlist?uid=${uid}`);
      const data = await res.json();
      if (data.playlist) {
        setPlaylists(data.playlist.map((p: any) => ({
          id: p.id, name: p.name, coverImgUrl: p.coverImgUrl, trackCount: p.trackCount, playCount: p.playCount,
        })));
      }
    } catch {}
  };

  const loadPlaylistTracks = async (playlist: NeteasePlaylist) => {
    try {
      setLoading(true);
      setSelectedPlaylist(playlist);
      const res = await fetch(`${API_BASE}/playlist/track/all?id=${playlist.id}`);
      const data = await res.json();
      if (data.songs) {
        const tracks = data.songs.map((s: any) => ({
          id: s.id, name: s.name, ar: s.ar, al: s.al, dt: s.dt,
        }));
        setPlaylistTracks(tracks);
        setTrackList(tracks);
      }
      setDashboardTab('playlist-tracks');
    } catch {} finally { setLoading(false); }
  };

  const loadQqPlaylists = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/qq/playlist/recommend`);
      const data = await res.json();
      if (data.code === 0 && data.playlists) {
        setPlaylists(data.playlists.map((p: any) => ({
          id: p.id, name: p.name, coverImgUrl: p.coverImgUrl, trackCount: p.trackCount,
        })));
      }
    } catch {} finally { setLoading(false); }
  };

  const loadQqPlaylistTracks = async (playlist: NeteasePlaylist) => {
    try {
      setLoading(true);
      setSelectedPlaylist(playlist);
      const res = await fetch(`${API_BASE}/qq/playlist/tracks?id=${playlist.id}`);
      const data = await res.json();
      if (data.code === 0 && data.tracks) {
        const tracks = data.tracks.map((t: any) => ({
          id: t.id, name: t.name, ar: [{ name: t.artist }], al: { name: t.album }, dt: t.duration * 1000, mid: t.mid,
        }));
        setPlaylistTracks(tracks);
        setTrackList(tracks);
      }
      setDashboardTab('playlist-tracks');
    } catch {} finally { setLoading(false); }
  };

  const searchSongs = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/search?keywords=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.result && data.result.songs) {
        const tracks = data.result.songs.map((s: any) => ({
          id: s.id, name: s.name, ar: s.ar, al: s.al, dt: s.dt,
        }));
        setSearchResults(tracks);
        setTrackList(tracks);
      }
      setDashboardTab('search');
    } catch {} finally { setLoading(false); }
  };

  const playTrack = async (track: NeteaseTrack) => {
    try {
      setCurrentTrack(track);
      setDashboardTab('playing');
      setExternalPlaying(true);

      const isQq = activeMusicPlatform === 'qq';
      const urlEndpoint = isQq ? `${API_BASE}/qq/song/url?mid=${(track as any).mid || track.id}` : `${API_BASE}/song/url?id=${track.id}`;
      const lyricEndpoint = isQq ? `${API_BASE}/qq/lyric?mid=${(track as any).mid || track.id}` : `${API_BASE}/lyric?id=${track.id}`;

      const urlRes = await fetch(urlEndpoint);
      const urlData = await urlRes.json();
      const url = isQq ? urlData.url : (urlData.data?.[0]?.url);
      if (url) {
        setTrackUrl(url);
        startExternalPlayback(url);
      }

      const lyricRes = await fetch(lyricEndpoint);
      const lyricData = await lyricRes.json();
      let lrcText = '';
      if (isQq) {
        lrcText = lyricData.lrc?.lyric || '';
      } else {
        lrcText = lyricData.lrc?.lyric || '';
      }
      setLyrics(lrcText ? parseLrc(lrcText) : []);
    } catch {}
  };

  const searchQqSongs = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/qq/search?keywords=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.songs) {
        setQqSearchResults(data.songs);
        setTrackList(data.songs);
      }
      setDashboardTab('search');
    } catch {} finally { setLoading(false); }
  };

  const startExternalPlayback = (url: string) => {
    if (externalAudioRef.current) {
      externalAudioRef.current.pause();
      externalAudioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      externalAudioRef.current.removeEventListener('ended', handleEnded);
      externalAudioRef.current = null;
    }
    const audio = new Audio(url);
    audio.volume = externalVolume / 100;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.play().catch(() => {});
    externalAudioRef.current = audio;
  };

  const handleTimeUpdate = () => {
    if (externalAudioRef.current) {
      setPlayProgress(externalAudioRef.current.currentTime);
      setPlayDuration(externalAudioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setExternalPlaying(false);
    playNextTrack();
  };

  const playNextTrack = () => {
    if (!currentTrack || trackList.length === 0) return;
    const idx = trackList.findIndex(t => t.id === currentTrack.id);
    if (idx >= 0 && idx < trackList.length - 1) {
      playTrack(trackList[idx + 1]);
    }
  };

  const playPrevTrack = () => {
    if (!currentTrack || trackList.length === 0) return;
    const idx = trackList.findIndex(t => t.id === currentTrack.id);
    if (idx > 0) {
      playTrack(trackList[idx - 1]);
    }
  };

  const parseLrc = (lrc: string): NeteaseLyric[] => {
    const lines = lrc.split('\n');
    const result: NeteaseLyric[] = [];
    const regex = /\[(\d+):(\d+)\.(\d+)\]/;
    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100;
        const text = line.replace(/\[\d+:\d+\.\d+\]/g, '').trim();
        if (text) result.push({ time, text });
      }
    }
    return result;
  };

  useEffect(() => {
    if (externalAudioRef.current) {
      externalPlaying ? externalAudioRef.current.play().catch(() => {}) : externalAudioRef.current.pause();
    }
  }, [externalPlaying]);

  useEffect(() => {
    if (externalAudioRef.current) externalAudioRef.current.volume = externalVolume / 100;
  }, [externalVolume]);

  useEffect(() => {
    if (lyrics.length === 0) { setCurrentLyricIdx(-1); return; }
    let idx = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (playProgress >= lyrics[i].time) { idx = i; break; }
    }
    setCurrentLyricIdx(idx);
  }, [playProgress, lyrics]);

  const toggleExternalPlay = () => {
    if (!externalAudioRef.current || !trackUrl) return;
    setExternalPlaying(!externalPlaying);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!externalAudioRef.current || !playDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    externalAudioRef.current.currentTime = clamped * playDuration;
    setPlayProgress(clamped * playDuration);
  };

  const toggleMute = () => {
    if (isMuted) {
      setExternalVolume(prevVolumeRef.current);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = externalVolume;
      setExternalVolume(0);
      setIsMuted(true);
    }
  };

  const handleLogout = async () => {
    try { await fetch(`${API_BASE}/logout`, { method: 'POST' }); } catch {}
    setNeteaseUser(null);
    setPlatformView('select');
    setPlaylists([]);
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
    setSearchResults([]);
    setCurrentTrack(null);
    setTrackUrl('');
    setLyrics([]);
    setTrackList([]);
    if (externalAudioRef.current) { externalAudioRef.current.pause(); externalAudioRef.current = null; }
    setExternalPlaying(false);
    setPlayProgress(0);
    setPlayDuration(0);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const getLyricDisplay = () => {
    if (lyrics.length === 0) return { prev: '', current: '暂无歌词', next: '' };
    const idx = currentLyricIdx;
    return {
      prev: idx > 0 ? lyrics[idx - 1].text : '',
      current: idx >= 0 ? lyrics[idx].text : lyrics[0].text,
      next: idx < lyrics.length - 1 ? lyrics[idx + 1].text : '',
    };
  };

  const renderNeteaseContent = () => {
    if (platformView === 'select') {
      return (
        <div className="flex flex-col items-center gap-5 py-6">
          <p className="text-[11px] text-white/30 tracking-wider">选择音乐平台</p>
          <div className="flex gap-6 items-start">
            <button
              onClick={() => { setActiveMusicPlatform('netease'); setPlatformView('login'); startQrLogin(); }}
              className="group flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                <img src="/icons/netease.png" alt="网易云音乐" className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] text-white/60 group-hover:text-white/90 transition-colors">网易云音乐</p>
            </button>
            <button
              onClick={() => { setActiveMusicPlatform('qq'); setPlatformView('login'); startQqQrLogin(); }}
              className="group flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                <img src="/icons/qqmusic.png" alt="QQ 音乐" className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] text-white/60 group-hover:text-white/90 transition-colors">QQ 音乐</p>
            </button>
          </div>
        </div>
      );
    }

    if (platformView === 'login') {
      const isNetease = activeMusicPlatform === 'netease';
      const currentQrImg = isNetease ? qrImg : qqQrImg;
      const currentQrStatus = isNetease ? qrStatus : qqQrStatus;
      const currentPlatformName = isNetease ? '网易云音乐' : 'QQ 音乐';
      const currentIcon = isNetease ? '/icons/netease.png' : '/icons/qqmusic.png';
      const refreshQr = isNetease ? startQrLogin : startQqQrLogin;

      return (
        <div className="flex flex-col items-center gap-4 py-4">
          <button onClick={() => { setPlatformView('select'); if (pollRef.current) clearInterval(pollRef.current); if (qqPollRef.current) clearInterval(qqPollRef.current); }} className="self-start flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors">
            <ChevronLeft size={12} /> 返回选择
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10">
              <img src={currentIcon} alt="" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-medium text-white/90">{currentPlatformName}登录</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            {currentQrImg ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-white/10 bg-white p-3 shadow-xl shadow-black/20"
              >
                <img src={currentQrImg} alt="QR Code" className="w-40 h-40" />
              </motion.div>
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                {loading ? <Loader2 size={24} className="text-white/40 animate-spin" /> : <span className="text-white/30 text-xs">点击下方按钮获取</span>}
              </div>
            )}
            <p className={`text-[11px] ${currentQrStatus.includes('成功') ? 'text-green-400' : currentQrStatus.includes('过期') ? 'text-amber-400' : 'text-white/40'}`}>{currentQrStatus || '点击获取二维码'}</p>
            {(currentQrStatus.includes('过期') || !currentQrImg) && (
              <button onClick={refreshQr} className="rounded-xl bg-white/10 px-6 py-2 text-xs text-white/70 hover:bg-white/15 transition-colors active:scale-95">
                {currentQrImg ? '刷新二维码' : '获取二维码'}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => { setPlatformView('select'); setActiveMusicPlatform(null); }} className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0" title="切换平台">
            <ChevronLeft size={12} />
          </button>
          {activeMusicPlatform === 'qq' && qqUser ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {qqUser.avatarUrl ? (
                <img src={qqUser.avatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0 ring-1 ring-white/10" />
              ) : (
                <div className="w-6 h-6 rounded-full flex-shrink-0 bg-white/10 flex items-center justify-center text-[9px] text-white/50">QQ</div>
              )}
              <span className="text-xs text-white/70 truncate">{qqUser.nickname}</span>
            </div>
          ) : activeMusicPlatform === 'qq' ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0">
                <img src="/icons/qqmusic.png" alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs text-white/70">QQ 音乐</span>
            </div>
          ) : neteaseUser ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img src={neteaseUser.avatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0 ring-1 ring-white/10" />
              <span className="text-xs text-white/70 truncate">{neteaseUser.nickname}</span>
            </div>
          ) : null}
          {activeMusicPlatform === 'netease' && (
            <button onClick={handleLogout} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0" title="退出登录">
              <LogOut size={12} />
            </button>
          )}
          {activeMusicPlatform === 'qq' && qqUser && (
            <button onClick={() => { setQqUser(null); setPlaylists([]); setPlatformView('select'); setActiveMusicPlatform(null); }} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0" title="退出登录">
              <LogOut size={12} />
            </button>
          )}
        </div>

        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                activeMusicPlatform === 'qq' ? searchQqSongs() : searchSongs();
              }
            }}
            placeholder="搜索歌曲..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-6 pr-6 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setQqSearchResults([]); setDashboardTab('playlists'); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X size={11} />
            </button>
          )}
        </div>

        {dashboardTab === 'playlists' && (
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setDashboardTab('playlists')} className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${dashboardTab === 'playlists' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
              <ListMusic size={10} className="inline mr-1" />{activeMusicPlatform === 'qq' ? '推荐歌单' : '我的歌单'}
            </button>
          </div>
        )}

        {dashboardTab === 'playlist-tracks' && selectedPlaylist && (
          <div className="flex items-center gap-1 mb-1">
            <button onClick={() => { setDashboardTab('playlists'); setSelectedPlaylist(null); }} className="text-white/40 hover:text-white/70 transition-colors">
              <ChevronLeft size={12} />
            </button>
            <span className="text-[11px] text-white/60 truncate">{selectedPlaylist.name}</span>
            <span className="text-[10px] text-white/30 ml-auto flex-shrink-0">{selectedPlaylist.trackCount}首</span>
          </div>
        )}

        {dashboardTab === 'search' && searchResults.length > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <button onClick={() => { setDashboardTab('playlists'); setSearchResults([]); }} className="text-white/40 hover:text-white/70 transition-colors">
              <ChevronLeft size={12} />
            </button>
            <span className="text-[11px] text-white/60">搜索结果</span>
          </div>
        )}

        {dashboardTab === 'playing' && currentTrack && (
          <div className="flex items-center gap-1 mb-1">
            <button onClick={() => setDashboardTab(selectedPlaylist ? 'playlist-tracks' : playlists.length > 0 ? 'playlists' : 'search')} className="text-white/40 hover:text-white/70 transition-colors">
              <ChevronLeft size={12} />
            </button>
            <span className="text-[11px] text-white/60 truncate">正在播放</span>
          </div>
        )}

        <div className="max-h-48 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={18} className="text-white/30 animate-spin" />
            </div>
          )}

          {!loading && dashboardTab === 'playlists' && playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => activeMusicPlatform === 'qq' ? loadQqPlaylistTracks(pl) : loadPlaylistTracks(pl)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all hover:bg-white/5"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-white/5 overflow-hidden">
                {pl.coverImgUrl ? (
                  <img src={activeMusicPlatform === 'qq' ? pl.coverImgUrl : pl.coverImgUrl + '?param=40y40'} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ListMusic size={12} className="text-white/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-white/70 truncate">{pl.name}</p>
                <p className="text-[9px] text-white/30">{activeMusicPlatform === 'qq' ? `${(pl.trackCount / 10000).toFixed(1)}万播放` : `${pl.trackCount}首`}</p>
              </div>
            </button>
          ))}

          {!loading && dashboardTab === 'playlist-tracks' && playlistTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => playTrack(track)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${currentTrack?.id === track.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/5">
                {currentTrack?.id === track.id && externalPlaying ? (
                  <Pause size={10} className="text-white/60" />
                ) : (
                  <Play size={10} className="ml-0.5 text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] truncate ${currentTrack?.id === track.id ? 'text-white font-medium' : 'text-white/60'}`}>{track.name}</p>
                <p className="text-[9px] text-white/30 truncate">{track.ar.map((a) => a.name).join(' / ')}</p>
              </div>
              <span className="text-[9px] text-white/20 flex-shrink-0">{formatTime(track.dt / 1000)}</span>
            </button>
          ))}

          {!loading && dashboardTab === 'search' && (activeMusicPlatform === 'qq' ? qqSearchResults : searchResults).map((track) => (
            <button
              key={track.id}
              onClick={() => playTrack(track)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-all ${currentTrack?.id === track.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-white/5">
                {currentTrack?.id === track.id && externalPlaying ? (
                  <Pause size={10} className="text-white/60" />
                ) : (
                  <Play size={10} className="ml-0.5 text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] truncate ${currentTrack?.id === track.id ? 'text-white font-medium' : 'text-white/60'}`}>{track.name}</p>
                <p className="text-[9px] text-white/30 truncate">{track.ar.map((a) => a.name).join(' / ')}</p>
              </div>
              <span className="text-[9px] text-white/20 flex-shrink-0">{formatTime(track.dt / 1000)}</span>
            </button>
          ))}

          {!loading && dashboardTab === 'playing' && currentTrack && (() => {
            const { prev, current, next } = getLyricDisplay();
            return (
              <div className="flex w-full flex-col gap-2">
                <div className="flex items-center gap-3">
                  {currentTrack.al?.picUrl && (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={currentTrack.al.picUrl + '?param=100y100'} alt=""
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-lg shadow-black/30"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{currentTrack.name}</p>
                    <p className="text-[10px] text-white/40 truncate">{currentTrack.ar.map((a) => a.name).join(' / ')}</p>
                  </div>
                </div>

                <div className="relative rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06] px-3 py-2.5 overflow-hidden min-h-[68px]">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-white/[0.02] pointer-events-none" />
                  <div className="flex flex-col items-center gap-1 relative z-10">
                    <AnimatePresence mode="wait">
                      {prev && (
                        <motion.p key={`prev-${currentLyricIdx}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.2, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="text-[10px] text-white/20 text-center w-full truncate select-none">
                          {prev}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.p key={`curr-${currentLyricIdx}`} initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }} className="text-[12px] font-semibold text-white text-center w-full select-none leading-relaxed" style={{ textShadow: '0 0 20px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.3)' }}>
                        {current}
                      </motion.p>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      {next && (
                        <motion.p key={`next-${currentLyricIdx}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.15, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} className="text-[10px] text-white/15 text-center w-full truncate select-none">
                          {next}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/30 w-8 text-right flex-shrink-0">{formatTime(playProgress)}</span>
                  <div ref={progressRef} onClick={seekTo} className="flex-1 h-1 rounded-full bg-white/10 cursor-pointer relative group">
                    <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-white/50 to-white/70 transition-[width] duration-100" style={{ width: playDuration ? `${(playProgress / playDuration) * 100}%` : '0%' }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: playDuration ? `calc(${(playProgress / playDuration) * 100}% - 5px)` : '0%' }} />
                  </div>
                  <span className="text-[9px] text-white/30 w-8 flex-shrink-0">{formatTime(playDuration)}</span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button onClick={playPrevTrack} className="text-white/40 hover:text-white/70 transition-colors active:scale-90">
                    <SkipBack size={15} />
                  </button>
                  <button onClick={toggleExternalPlay} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/15 transition-all active:scale-90">
                    {externalPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                  </button>
                  <button onClick={playNextTrack} className="text-white/40 hover:text-white/70 transition-colors active:scale-90">
                    <SkipForward size={15} />
                  </button>
                  <div className="flex items-center gap-1 ml-1">
                    <button onClick={toggleMute} className="text-white/30 hover:text-white/60 transition-colors">
                      {isMuted || externalVolume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : externalVolume}
                      onChange={(e) => { setExternalVolume(Number(e.target.value)); if (isMuted) setIsMuted(false); }}
                      className="w-14 h-1 rounded-full appearance-none bg-white/15 accent-white/70 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {currentTrack && dashboardTab !== 'playing' && (
          <button
            onClick={() => setDashboardTab('playing')}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 mt-1 hover:bg-white/10 transition-colors"
          >
            {externalPlaying ? (
              <Pause size={10} className="text-white/60" onClick={(e) => { e.stopPropagation(); toggleExternalPlay(); }} />
            ) : (
              <Play size={10} className="ml-0.5 text-white/40" onClick={(e) => { e.stopPropagation(); toggleExternalPlay(); }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/60 truncate">{currentTrack.name} - {currentTrack.ar.map((a) => a.name).join(' / ')}</p>
            </div>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full gap-1 rounded-lg bg-white/5 p-0.5">
        <button onClick={() => setActiveTab('builtin')} className={`flex items-center gap-1 flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${activeTab === 'builtin' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
          <Music size={10} /> 纯音乐
        </button>
        <button onClick={() => setActiveTab('external')} className={`flex items-center gap-1 flex-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all ${activeTab === 'external' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
          <Globe size={10} /> 在线音乐
        </button>
      </div>

      {activeTab === 'builtin' ? (
        <>
          <div className="relative">
            <button onClick={() => setShowList(!showList)} className="flex w-full items-center gap-2 rounded-xl bg-white/5 px-3 py-2 transition-all hover:bg-white/10">
              <span className="text-xl">{displayEmoji}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{displayName}</p>
                <p className="text-xs text-white/40">{currentMusic?.description ?? '点击选择音乐'}</p>
              </div>
              <ChevronDown size={14} className={`text-white/40 transition-transform ${showList ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showList && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/90 p-1 backdrop-blur-xl">
                  {musicList.map((m) => (
                    <button key={m.id} onClick={() => { setMusic(m.id); setShowList(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${selectedMusic === m.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white/80'}`}>
                      <span>{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-white/40">{m.description}</p>
                      </div>
                    </button>
                  ))}
                  {customMusicList.length > 0 && <div className="mx-2 my-1 border-t border-white/10" />}
                  {customMusicList.map((m) => (
                    <button key={m.id} onClick={() => { setMusic(m.id); setShowList(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${selectedMusic === m.id ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white/80'}`}>
                      <span>{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-white/40">{m.description}</p>
                      </div>
                      {m.url && <span className="text-[9px] text-white/20 bg-white/5 rounded px-1">本地</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <ElasticSlider defaultValue={volume} startingValue={0} maxValue={100} leftIcon={<VolumeX size={14} className="text-white/40" />} rightIcon={<Volume2 size={14} className="text-white/40" />} onChange={(v) => setVolume(Math.round(v))} className="w-full" />
          <button onClick={() => setIsPlaying(!isPlaying)} className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 backdrop-blur-sm transition-all hover:bg-white/15 active:scale-95">
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
        </>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          {renderNeteaseContent()}
        </div>
      )}
    </div>
  );
}
