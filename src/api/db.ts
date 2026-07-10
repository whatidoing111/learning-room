const API_BASE = 'http://localhost:3000/api/db';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export const dbApi = {
  getUser: (id: string) => request<{ code: number; user: any }>(`${API_BASE}/user/${id}`),

  createUser: (id: string, username: string, avatar: string) =>
    request<{ code: number; user: any }>(`${API_BASE}/user`, {
      method: 'POST',
      body: JSON.stringify({ id, username, avatar }),
    }),

  getTodos: (userId: string) => request<{ code: number; todos: any[] }>(`${API_BASE}/todos/${userId}`),

  addTodo: (id: string, userId: string, text: string, completed: boolean, createdAt?: number) =>
    request<{ code: number }>(`${API_BASE}/todos`, {
      method: 'POST',
      body: JSON.stringify({ id, userId, text, completed, createdAt }),
    }),

  updateTodo: (id: string, userId: string, text: string, completed: boolean) =>
    request<{ code: number }>(`${API_BASE}/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ userId, text, completed }),
    }),

  deleteTodo: (id: string, userId: string) =>
    request<{ code: number }>(`${API_BASE}/todos/${id}?userId=${userId}`, { method: 'DELETE' }),

  getCustomScenes: (userId: string) => request<{ code: number; scenes: any[] }>(`${API_BASE}/scenes/${userId}`),

  addCustomScene: (id: string, userId: string, name: string, emoji: string, description: string, image: string) =>
    request<{ code: number }>(`${API_BASE}/scenes`, {
      method: 'POST',
      body: JSON.stringify({ id, userId, name, emoji, description, image }),
    }),

  deleteCustomScene: (id: string, userId: string) =>
    request<{ code: number }>(`${API_BASE}/scenes/${id}?userId=${userId}`, { method: 'DELETE' }),

  getCustomMusic: (userId: string) => request<{ code: number; music: any[] }>(`${API_BASE}/music/${userId}`),

  addCustomMusic: (data: { id: string; userId: string; name: string; artist?: string; category?: string; url?: string; coverUrl?: string; duration?: number }) =>
    request<{ code: number }>(`${API_BASE}/music`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteCustomMusic: (id: string, userId: string) =>
    request<{ code: number }>(`${API_BASE}/music/${id}?userId=${userId}`, { method: 'DELETE' }),

  getSettings: (userId: string) => request<{ code: number; settings: any }>(`${API_BASE}/settings/${userId}`),

  saveSettings: (settings: { userId: string; selectedScene?: string; selectedMusic?: string; volume?: number; externalVolume?: number; pomodoroWork?: number; pomodoroBreak?: number; theme?: string }) =>
    request<{ code: number }>(`${API_BASE}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  getStats: (userId: string) => request<{ code: number; stats: any }>(`${API_BASE}/stats/${userId}`),

  saveStats: (stats: { userId: string; totalSessions?: number; totalMinutes?: number; currentStreak?: number; bestStreak?: number; lastStudyDate?: string | null; todayStudySeconds?: number; todayPomodoroCount?: number; streakDays?: number }) =>
    request<{ code: number }>(`${API_BASE}/stats`, {
      method: 'POST',
      body: JSON.stringify(stats),
    }),

  getFavoriteScenes: (userId: string) => request<{ code: number; favorites: string[] }>(`${API_BASE}/favorites/scenes/${userId}`),

  toggleFavoriteScene: (userId: string, sceneId: string, action?: 'add' | 'remove') =>
    request<{ code: number }>(`${API_BASE}/favorites/scenes`, {
      method: 'POST',
      body: JSON.stringify({ userId, sceneId, action }),
    }),

  getFavoriteMusic: (userId: string) => request<{ code: number; favorites: string[] }>(`${API_BASE}/favorites/music/${userId}`),

  toggleFavoriteMusic: (userId: string, musicId: string, action?: 'add' | 'remove') =>
    request<{ code: number }>(`${API_BASE}/favorites/music`, {
      method: 'POST',
      body: JSON.stringify({ userId, musicId, action }),
    }),

  getHistory: (userId: string, limit?: number) =>
    request<{ code: number; history: any[] }>(`${API_BASE}/history/${userId}?limit=${limit || 30}`),

  addHistory: (userId: string, date: string, duration: number, type?: string) =>
    request<{ code: number }>(`${API_BASE}/history`, {
      method: 'POST',
      body: JSON.stringify({ userId, date, duration, type }),
    }),
};
