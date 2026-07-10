import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { dbApi } from '../api/db';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  createdAt: number;
}

export interface CustomScene {
  id: string;
  name: string;
  emoji: string;
  description: string;
  image: string;
  userId: string;
}

export interface CustomMusic {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: string;
  userId: string;
  url?: string;
}

export type Theme = 'dark' | 'light' | 'auto' | 'rain' | 'ocean' | 'forest';
export type ActiveTab = 'timer' | 'todo' | 'music' | 'pomodoro' | 'noise' | 'stats';

export interface Noise {
  id: string;
  name: string;
  emoji: string;
  frequency: number;
  type: OscillatorType;
  volume: number;
  active: boolean;
}

export interface StudyStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
  todayStudySeconds: number;
  todayPomodoroCount: number;
  streakDays: number;
}

export interface ExternalTrack {
  id: string;
  name: string;
  artist: string;
  album?: string;
  duration?: number;
  coverUrl?: string;
  source: 'netease' | 'qq' | 'custom';
  sourceId?: string;
  url?: string;
}

export interface StudySession {
  id: string;
  date: number;
  duration: number;
  sceneId: string;
  musicId: string;
}

interface AppState {
  selectedScene: string;
  selectedMusic: string;
  volume: number;
  isPlaying: boolean;
  externalVolume: number;
  externalPlaying: boolean;
  currentExternal: ExternalTrack | null;
  todos: Todo[];
  pomodoroWork: number;
  pomodoroBreak: number;
  studyMinutes: number;
  pomodoroCount: number;
  user: UserProfile | null;
  customScenes: CustomScene[];
  customMusic: CustomMusic[];
  favoriteScenes: string[];
  favoriteMusic: string[];
  studyHistory: StudySession[];
  theme: Theme;
  activeTab: ActiveTab;
  panelExpanded: boolean;
  noises: Noise[];
  noiseVolume: number;
  stats: StudyStats;
  setScene: (id: string) => void;
  setMusic: (id: string) => void;
  setVolume: (v: number) => void;
  setIsPlaying: (v: boolean) => void;
  setExternalVolume: (v: number) => void;
  setExternalPlaying: (v: boolean) => void;
  setCurrentExternal: (track: ExternalTrack | null) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  setPomodoroWork: (m: number) => void;
  setPomodoroBreak: (m: number) => void;
  addStudyMinutes: (m: number) => void;
  addPomodoro: () => void;
  login: (username: string) => void;
  logout: () => void;
  loadFromDb: () => Promise<void>;
  addCustomScene: (scene: Omit<CustomScene, 'id' | 'userId'>) => void;
  removeCustomScene: (id: string) => void;
  addCustomMusic: (music: Omit<CustomMusic, 'id' | 'userId'>) => void;
  removeCustomMusic: (id: string) => void;
  toggleFavoriteScene: (id: string) => void;
  toggleFavoriteMusic: (id: string) => void;
  addStudySession: (session: Omit<StudySession, 'id'>) => void;
  setTheme: (t: Theme) => void;
  setActiveTab: (t: ActiveTab) => void;
  togglePanel: () => void;
  toggleNoise: (id: string) => void;
  setNoiseVolume: (v: number) => void;
  addStudySeconds: (s: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      selectedScene: 'cafe',
      selectedMusic: 'rain',
      volume: 50,
      isPlaying: false,
      externalVolume: 50,
      externalPlaying: false,
      currentExternal: null,
      todos: [],
      pomodoroWork: 25,
      pomodoroBreak: 5,
      studyMinutes: 0,
      pomodoroCount: 0,
      user: null,
      customScenes: [],
      customMusic: [],
      favoriteScenes: [],
      favoriteMusic: [],
      studyHistory: [],
      theme: 'dark' as Theme,
      activeTab: 'timer' as ActiveTab,
      panelExpanded: true,
      noises: [],
      noiseVolume: 50,
      stats: { totalSessions: 0, totalMinutes: 0, currentStreak: 0, bestStreak: 0, lastStudyDate: null, todayStudySeconds: 0, todayPomodoroCount: 0, streakDays: 0 },
      setScene: (id) => {
        set({ selectedScene: id });
        const { user } = useStore.getState();
        if (user) dbApi.saveSettings({ userId: user.id, selectedScene: id }).catch(() => {});
      },
      setMusic: (id) => {
        set({ selectedMusic: id });
        const { user } = useStore.getState();
        if (user) dbApi.saveSettings({ userId: user.id, selectedMusic: id }).catch(() => {});
      },
      setVolume: (v) => {
        set({ volume: v });
        const { user } = useStore.getState();
        if (user) dbApi.saveSettings({ userId: user.id, volume: v }).catch(() => {});
      },
      setIsPlaying: (v) => set({ isPlaying: v }),
      setExternalVolume: (v) => {
        set({ externalVolume: v });
        const { user } = useStore.getState();
        if (user) dbApi.saveSettings({ userId: user.id, externalVolume: v }).catch(() => {});
      },
      setExternalPlaying: (v) => set({ externalPlaying: v }),
      setCurrentExternal: (track) => set({ currentExternal: track }),
      addTodo: (text) => {
        const id = Date.now().toString();
        const { user } = useStore.getState();
        set((s) => ({
          todos: [...s.todos, { id, text, completed: false, createdAt: Date.now() }],
        }));
        if (user) dbApi.addTodo(id, user.id, text, false, Date.now()).catch(() => {});
      },
      toggleTodo: (id) => {
        const { user, todos } = useStore.getState();
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        const newCompleted = !todo.completed;
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)),
        }));
        if (user) dbApi.updateTodo(id, user.id, todo.text, newCompleted).catch(() => {});
      },
      removeTodo: (id) => {
        const { user } = useStore.getState();
        set((s) => ({
          todos: s.todos.filter((t) => t.id !== id),
        }));
        if (user) dbApi.deleteTodo(id, user.id).catch(() => {});
      },
      setPomodoroWork: (m) => {
        set({ pomodoroWork: m });
        const { user } = useStore.getState();
        if (user) dbApi.saveSettings({ userId: user.id, pomodoroWork: m }).catch(() => {});
      },
      setPomodoroBreak: (m) => {
        set({ pomodoroBreak: m });
        const { user } = useStore.getState();
        if (user) dbApi.saveSettings({ userId: user.id, pomodoroBreak: m }).catch(() => {});
      },
      addStudyMinutes: (m) =>
        set((s) => ({ studyMinutes: s.studyMinutes + m })),
      addPomodoro: () =>
        set((s) => ({ pomodoroCount: s.pomodoroCount + 1 })),
      login: (username) => {
        const userId = Date.now().toString();
        const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(username)}`;
        set({
          user: { id: userId, username, avatar, createdAt: Date.now() },
        });
        dbApi.createUser(userId, username, avatar).catch(() => {});
      },
      logout: () => {
        set({
          user: null,
          customScenes: [],
          customMusic: [],
          favoriteScenes: [],
          favoriteMusic: [],
          studyHistory: [],
        });
      },
      loadFromDb: async () => {
        const { user } = useStore.getState();
        if (!user) return;
        try {
          const [todosRes, scenesRes, musicRes, settingsRes, statsRes, favScenesRes, favMusicRes] = await Promise.all([
            dbApi.getTodos(user.id),
            dbApi.getCustomScenes(user.id),
            dbApi.getCustomMusic(user.id),
            dbApi.getSettings(user.id),
            dbApi.getStats(user.id),
            dbApi.getFavoriteScenes(user.id),
            dbApi.getFavoriteMusic(user.id),
          ]);
          const patch: Partial<AppState> = {};
          if (todosRes.code === 0 && todosRes.todos.length > 0) patch.todos = todosRes.todos.map((t: any) => ({ id: t.id, text: t.text, completed: !!t.completed, createdAt: t.created_at }));
          if (scenesRes.code === 0 && scenesRes.scenes.length > 0) patch.customScenes = scenesRes.scenes.map((s: any) => ({ id: s.id, name: s.name, emoji: s.emoji, description: s.description, image: s.image, userId: s.user_id }));
          if (musicRes.code === 0 && musicRes.music.length > 0) patch.customMusic = musicRes.music.map((m: any) => ({ id: m.id, name: m.name, emoji: '', description: '', category: m.category, userId: m.user_id, url: m.url }));
          if (settingsRes.code === 0 && settingsRes.settings) {
            const s = settingsRes.settings;
            patch.selectedScene = s.selected_scene || 'cafe';
            patch.selectedMusic = s.selected_music || 'rain';
            patch.volume = s.volume ?? 50;
            patch.externalVolume = s.external_volume ?? 50;
            patch.pomodoroWork = s.pomodoro_work ?? 25;
            patch.pomodoroBreak = s.pomodoro_break ?? 5;
            patch.theme = s.theme || 'dark';
          }
          if (statsRes.code === 0 && statsRes.stats) {
            const s = statsRes.stats;
            patch.stats = { totalSessions: s.total_sessions, totalMinutes: s.total_minutes, currentStreak: s.current_streak, bestStreak: s.best_streak, lastStudyDate: s.last_study_date, todayStudySeconds: s.today_study_seconds, todayPomodoroCount: s.today_pomodoro_count, streakDays: s.streak_days };
          }
          if (favScenesRes.code === 0) patch.favoriteScenes = favScenesRes.favorites;
          if (favMusicRes.code === 0) patch.favoriteMusic = favMusicRes.favorites;
          set(patch);
        } catch {}
      },
      addCustomScene: (scene) => {
        const { user } = useStore.getState();
        if (!user) return;
        const id = Date.now().toString();
        set((s) => ({
          customScenes: [...s.customScenes, { ...scene, id, userId: user.id }],
        }));
        dbApi.addCustomScene(id, user.id, scene.name, scene.emoji, scene.description, scene.image).catch(() => {});
      },
      removeCustomScene: (id) => {
        const { user } = useStore.getState();
        set((s) => ({
          customScenes: s.customScenes.filter((sc) => sc.id !== id),
        }));
        if (user) dbApi.deleteCustomScene(id, user.id).catch(() => {});
      },
      addCustomMusic: (music) => {
        const { user } = useStore.getState();
        if (!user) return;
        const id = Date.now().toString();
        set((s) => ({
          customMusic: [...s.customMusic, { ...music, id, userId: user.id }],
        }));
        dbApi.addCustomMusic({ id, userId: user.id, name: music.name, artist: music.emoji, category: music.category, url: music.url }).catch(() => {});
      },
      removeCustomMusic: (id) => {
        const { user } = useStore.getState();
        set((s) => ({
          customMusic: s.customMusic.filter((m) => m.id !== id),
        }));
        if (user) dbApi.deleteCustomMusic(id, user.id).catch(() => {});
      },
      toggleFavoriteScene: (id) => {
        const { user, favoriteScenes } = useStore.getState();
        const isFav = favoriteScenes.includes(id);
        set((s) => ({
          favoriteScenes: isFav ? s.favoriteScenes.filter((fid) => fid !== id) : [...s.favoriteScenes, id],
        }));
        if (user) dbApi.toggleFavoriteScene(user.id, id, isFav ? 'remove' : 'add').catch(() => {});
      },
      toggleFavoriteMusic: (id) => {
        const { user, favoriteMusic } = useStore.getState();
        const isFav = favoriteMusic.includes(id);
        set((s) => ({
          favoriteMusic: isFav ? s.favoriteMusic.filter((fid) => fid !== id) : [...s.favoriteMusic, id],
        }));
        if (user) dbApi.toggleFavoriteMusic(user.id, id, isFav ? 'remove' : 'add').catch(() => {});
      },
      addStudySession: (session) =>
        set((s) => ({
          studyHistory: [
            ...s.studyHistory,
            { ...session, id: Date.now().toString() },
          ],
        })),
      setTheme: (t) => {
        set({ theme: t });
        const { user } = useStore.getState();
        if (user) dbApi.saveSettings({ userId: user.id, theme: t }).catch(() => {});
      },
      setActiveTab: (t) => set({ activeTab: t }),
      togglePanel: () => set((s) => ({ panelExpanded: !s.panelExpanded })),
      toggleNoise: (id) =>
        set((s) => ({
          noises: s.noises.map((n) => (n.id === id ? { ...n, active: !n.active } : n)),
        })),
      setNoiseVolume: (v) => set({ noiseVolume: v }),
      addStudySeconds: (sec) =>
        set((s) => ({ studyMinutes: s.studyMinutes + Math.floor(sec / 60) })),
    }),
    { name: 'learning-room-storage' }
  )
);
