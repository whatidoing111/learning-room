const express = require('express');
const cors = require('cors');
const https = require('https');
const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi');

const app = express();
const PORT = 3000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let cookieJar = {};

const proxy = async (req, res, endpoint, params = {}) => {
  try {
    const result = await NeteaseCloudMusicApi[endpoint]({
      ...params,
      cookie: cookieJar,
    });
    if (result.body && result.body.cookie) {
      cookieJar = { ...cookieJar, ...parseCookies(result.body.cookie) };
    }
    res.json(result.body);
  } catch (err) {
    console.error(`Error in ${endpoint}:`, err.message);
    res.status(500).json({ code: -1, msg: err.message });
  }
};

function parseCookies(cookieStr) {
  if (typeof cookieStr !== 'string') return {};
  const cookies = {};
  cookieStr.split(';').forEach((c) => {
    const [key, ...val] = c.trim().split('=');
    if (key) cookies[key.trim()] = val.join('=').trim();
  });
  return cookies;
}

app.get('/api/qr/key', (req, res) => {
  const timestamp = Date.now();
  proxy(req, res, 'login_qr_key', { timestamp });
});

app.get('/api/qr/create', (req, res) => {
  const { key } = req.query;
  const timestamp = Date.now();
  proxy(req, res, 'login_qr_create', { key, qrimg: true, timestamp });
});

app.get('/api/qr/check', (req, res) => {
  const { key } = req.query;
  const timestamp = Date.now();
  proxy(req, res, 'login_qr_check', { key, timestamp });
});

app.get('/api/user/account', (req, res) => {
  proxy(req, res, 'user_account', { timestamp: Date.now() });
});

app.get('/api/user/playlist', (req, res) => {
  const { uid } = req.query;
  proxy(req, res, 'user_playlist', { uid, timestamp: Date.now() });
});

app.get('/api/playlist/detail', (req, res) => {
  const { id } = req.query;
  proxy(req, res, 'playlist_detail', { id, timestamp: Date.now() });
});

app.get('/api/playlist/track/all', (req, res) => {
  const { id } = req.query;
  proxy(req, res, 'playlist_track_all', { id, timestamp: Date.now() });
});

app.get('/api/song/url', (req, res) => {
  const { id } = req.query;
  proxy(req, res, 'song_url_v1', { id, level: 'standard', timestamp: Date.now() });
});

app.get('/api/lyric', (req, res) => {
  const { id } = req.query;
  proxy(req, res, 'lyric_new', { id, timestamp: Date.now() });
});

app.get('/api/search', (req, res) => {
  const { keywords, limit = 30, offset = 0 } = req.query;
  proxy(req, res, 'cloudsearch', { keywords, limit, offset, timestamp: Date.now() });
});

app.get('/api/recommend/songs', (req, res) => {
  proxy(req, res, 'recommend_songs', { timestamp: Date.now() });
});

app.get('/api/login/status', (req, res) => {
  const hasCookie = Object.keys(cookieJar).length > 0;
  if (hasCookie) {
    proxy(req, res, 'user_account', { timestamp: Date.now() });
  } else {
    res.json({ code: 200, account: null, profile: null });
  }
});

app.post('/api/logout', (req, res) => {
  cookieJar = {};
  res.json({ code: 200, msg: '已退出登录' });
});

function qqRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Referer': 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

app.get('/api/qq/search', async (req, res) => {
  try {
    const { keywords, page = 1, limit = 20 } = req.query;
    const url = `https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp?w=${encodeURIComponent(keywords)}&p=${page}&n=${limit}&format=json&cr=1&catZhida=1`;
    const data = await qqRequest(url);
    if (data.data && data.data.song && data.data.song.list) {
      const songs = data.data.song.list.map(s => ({
        id: s.songid,
        mid: s.songmid,
        name: s.songname,
        ar: (s.singer || []).map(a => ({ id: a.id, mid: a.mid, name: a.name })),
        al: { id: s.albumid || 0, mid: s.albummid || '', name: s.albumname || '', picUrl: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : '' },
        dt: (s.interval || 0) * 1000,
      }));
      res.json({ code: 0, songs });
    } else {
      res.json({ code: 0, songs: [] });
    }
  } catch (err) {
    console.error('QQ search error:', err.message);
    res.status(500).json({ code: -1, msg: err.message });
  }
});

app.get('/api/qq/song/url', async (req, res) => {
  try {
    const { mid } = req.query;
    const reqData = JSON.stringify({
      req_0: {
        module: 'vkey.GetVkeyServer',
        method: 'CgiGetVkey',
        param: {
          guid: '10000',
          songmid: [String(mid)],
          filename: [`M500${mid}.mp3`, `C400${mid}.m4a`, `M800${mid}.mp3`],
          songtype: [0],
          uin: '0',
          loginflag: 0,
          platform: '20',
        },
      },
      loginUin: '0',
      comm: { uin: '0', format: 'json', ct: 24, cv: 0 },
    });
    const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?data=${encodeURIComponent(reqData)}`;
    const data = await qqRequest(url);
    if (data.req_0 && data.req_0.data && data.req_0.data.midurlinfo && data.req_0.data.midurlinfo[0]) {
      const info = data.req_0.data.midurlinfo[0];
      const purl = info.purl;
      if (purl) {
        const sip = data.req_0.data.sip || ['https://dl.stream.qqmusic.qq.com/'];
        const fullUrl = sip[0] + purl;
        res.json({ code: 0, url: fullUrl });
      } else {
        res.json({ code: -1, msg: '需要VIP或版权限制' });
      }
    } else {
      res.json({ code: -1, msg: '获取播放链接失败' });
    }
  } catch (err) {
    console.error('QQ song url error:', err.message);
    res.status(500).json({ code: -1, msg: err.message });
  }
});

app.get('/api/qq/lyric', async (req, res) => {
  try {
    const { mid } = req.query;
    const reqData = JSON.stringify({
      comm: { ct: 19, cv: 1845 },
      lyric: { module: 'music.musichallSong.PlayLyricInfo', method: 'GetPlayLyricInfo', param: { songMID: String(mid), songID: 0 } },
    });
    const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?data=${encodeURIComponent(reqData)}`;
    const data = await qqRequest(url);
    let lyric = '';
    if (data.lyric && data.lyric.data) {
      lyric = data.lyric.data.lyric ? Buffer.from(data.lyric.data.lyric, 'base64').toString('utf-8') : '';
    }
    res.json({ code: 0, lrc: { lyric } });
  } catch (err) {
    console.error('QQ lyric error:', err.message);
    res.status(500).json({ code: -1, msg: err.message });
  }
});

let qqCookieJar = {};

function hash33(token) {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash += (hash << 5) + token.charCodeAt(i);
    hash &= 2147483647;
  }
  return hash & 2147483647;
}

app.get('/api/qq/qr/show', async (req, res) => {
  try {
    const t = Math.random();
    const url = `https://ssl.ptlogin2.qq.com/ptqrshow?appid=716027609&e=2&l=M&s=3&d=72&v=4&t=${t}&daid=383&pt_3rd_aid=100497308`;
    const resp = await fetch(url);
    const cookies = resp.headers.getSetCookie();
    let qrsig = '';
    for (const c of cookies) {
      const m = c.match(/qrsig=([^;]+)/);
      if (m) qrsig = m[1];
    }
    if (qrsig) {
      const buf = Buffer.from(await resp.arrayBuffer());
      res.json({ code: 0, qrsig, img: buf.toString('base64') });
    } else {
      res.json({ code: -1, msg: '获取二维码失败' });
    }
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message });
  }
});

app.get('/api/qq/qr/check', async (req, res) => {
  try {
    const { qrsig } = req.query;
    if (!qrsig) return res.json({ code: -1, msg: '缺少qrsig' });
    const ptqrtoken = hash33(qrsig);
    const ts = Date.now();
    const url = `https://ssl.ptlogin2.qq.com/ptqrlogin?u1=https%3A%2F%2Fgraph.qq.com%2Foauth2.0%2Flogin_jump&ptqrtoken=${ptqrtoken}&ptredirect=0&h=1&t=1&g=1&from_ui=1&ptlang=2052&action=0-0-${ts}&js_ver=22070111&js_type=1&login_sig=&pt_uistyle=40&aid=716027609&daid=383&pt_3rd_aid=100497308`;
    const resp = await fetch(url, {
      headers: { 'Cookie': `qrsig=${qrsig}` }
    });
    const data = await resp.text();
    const match = data.match(/ptuiCB\('(\d+)','(\d+)','(.*?)','(\d+)','(.*?)',\s*'?(.*?)'?\)/);
    if (match) {
      const [, code, , redirectUrl, , msg, nickname] = match;
      if (code === '65') {
        res.json({ code: 800, msg: '二维码已过期' });
      } else if (code === '66') {
        res.json({ code: 801, msg: '等待扫码' });
      } else if (code === '67') {
        res.json({ code: 802, msg: '已扫码，等待确认' });
      } else if (code === '0') {
        const setCookies = resp.headers.getSetCookie();
        qqCookieJar = {};
        for (const c of setCookies) {
          const parts = c.split(';')[0].split('=');
          if (parts.length >= 2) qqCookieJar[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
        let qqNum = '';
        if (redirectUrl) {
          const uinMatch = redirectUrl.match(/uin=(\d+)/);
          if (uinMatch) qqNum = uinMatch[1];
        }
        qqCookieJar._qqNum = qqNum;
        qqCookieJar._nickname = decodeURIComponent(nickname || '') || `QQ${qqNum}`;
        if (redirectUrl) {
          try {
            const sigResp = await fetch(redirectUrl, { redirect: 'follow' });
            const sigCookies = sigResp.headers.getSetCookie();
            for (const c of sigCookies) {
              const parts = c.split(';')[0].split('=');
              if (parts.length >= 2) qqCookieJar[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
          } catch {}
        }
        try {
          const pSkey = qqCookieJar['p_skey'] || '';
          let gtk = 5381;
          for (let i = 0; i < pSkey.length; i++) gtk += (gtk << 5) + pSkey.charCodeAt(i);
          gtk = gtk & 2147483647;
          qqCookieJar._gtk = String(gtk);
        } catch {}
        res.json({ code: 803, msg: '登录成功', qqNum, nickname: qqCookieJar._nickname });
      } else {
        res.json({ code: Number(code), msg: match[5] || '未知状态' });
      }
    } else {
      res.json({ code: -1, msg: '未知响应' });
    }
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message });
  }
});

app.get('/api/qq/login/status', (req, res) => {
  const hasCookie = Object.keys(qqCookieJar).length > 0;
  res.json({
    logged: hasCookie,
    qqNum: qqCookieJar._qqNum || '',
    nickname: qqCookieJar._nickname || '',
  });
});

app.get('/api/qq/user/info', async (req, res) => {
  try {
    if (!qqCookieJar._qqNum) return res.json({ code: -1, msg: '未登录' });
    const qqNum = qqCookieJar._qqNum;
    const avatar = `https://q.qlogo.cn/headimg_dl?dst_uin=${qqNum}&spec=640&img_type=jpg`;
    res.json({
      code: 0,
      profile: {
        qqNum,
        nickname: qqCookieJar._nickname || `QQ${qqNum}`,
        avatarUrl: avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message });
  }
});

app.get('/api/qq/playlist/recommend', async (req, res) => {
  try {
    const reqData = JSON.stringify({
      comm: { ct: 24, cv: 0 },
      recomPlaylist: {
        method: 'get_hot_recommend',
        param: { Async: '1', cmd: 2, id: 0, global: 1, start: 0, size: 30 },
        module: 'playlist.HotRecommendServer',
      },
    });
    const url = `https://u.y.qq.com/cgi-bin/musicu.fcg?data=${encodeURIComponent(reqData)}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const list = data?.recomPlaylist?.data?.v_hot || [];
    const playlists = list.map((item) => ({
      id: String(item.content_id || item.id),
      name: item.title || '未知歌单',
      coverImgUrl: item.cover || '',
      trackCount: item.listen_num || 0,
    }));
    res.json({ code: 0, playlists });
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message });
  }
});

app.get('/api/qq/playlist/tracks', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.json({ code: -1, msg: '缺少歌单ID' });
    const url = `https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&new_format=1&disstid=${id}&platform=yqq.json&needNewCode=0&format=json`;
    const resp = await fetch(url, { headers: { 'Referer': 'https://y.qq.com/' } });
    const data = await resp.json();
    const songlist = data?.cdlist?.[0]?.songlist || [];
    const tracks = songlist.map((song) => ({
      id: String(song.mid || song.id),
      name: song.name || song.title || '未知歌曲',
      artist: (song.singer || []).map((s) => s.name).join('/') || '未知歌手',
      album: song.album?.name || song.albumname || '',
      duration: song.interval || 0,
      mid: song.mid || '',
    }));
    res.json({ code: 0, tracks });
  } catch (err) {
    res.status(500).json({ code: -1, msg: err.message });
  }
});

const { stmts } = require('./db');

app.get('/api/db/user/:id', (req, res) => {
  const user = stmts.getUser.get(req.params.id);
  res.json({ code: 0, user: user || null });
});

app.post('/api/db/user', (req, res) => {
  const { id, username, avatar } = req.body;
  if (!id || !username) return res.json({ code: -1, msg: '缺少参数' });
  stmts.upsertUser.run(id, username, avatar || '', Date.now());
  const user = stmts.getUser.get(id);
  res.json({ code: 0, user });
});

app.get('/api/db/todos/:userId', (req, res) => {
  const todos = stmts.getTodos.all(req.params.userId);
  res.json({ code: 0, todos });
});

app.post('/api/db/todos', (req, res) => {
  const { id, userId, text, completed, createdAt } = req.body;
  if (!id || !userId || !text) return res.json({ code: -1, msg: '缺少参数' });
  stmts.insertTodo.run(id, userId, text, completed ? 1 : 0, createdAt || Date.now());
  res.json({ code: 0 });
});

app.put('/api/db/todos/:id', (req, res) => {
  const { userId, text, completed } = req.body;
  stmts.updateTodo.run(text, completed ? 1 : 0, req.params.id, userId);
  res.json({ code: 0 });
});

app.delete('/api/db/todos/:id', (req, res) => {
  const { userId } = req.query;
  stmts.deleteTodo.run(req.params.id, userId);
  res.json({ code: 0 });
});

app.get('/api/db/scenes/:userId', (req, res) => {
  const scenes = stmts.getCustomScenes.all(req.params.userId);
  res.json({ code: 0, scenes });
});

app.post('/api/db/scenes', (req, res) => {
  const { id, userId, name, emoji, description, image } = req.body;
  if (!id || !userId || !name) return res.json({ code: -1, msg: '缺少参数' });
  stmts.insertCustomScene.run(id, userId, name, emoji || '', description || '', image || '', Date.now());
  res.json({ code: 0 });
});

app.delete('/api/db/scenes/:id', (req, res) => {
  const { userId } = req.query;
  stmts.deleteCustomScene.run(req.params.id, userId);
  res.json({ code: 0 });
});

app.get('/api/db/music/:userId', (req, res) => {
  const music = stmts.getCustomMusic.all(req.params.userId);
  res.json({ code: 0, music });
});

app.post('/api/db/music', (req, res) => {
  const { id, userId, name, artist, category, url, coverUrl, duration } = req.body;
  if (!id || !userId || !name) return res.json({ code: -1, msg: '缺少参数' });
  stmts.insertCustomMusic.run(id, userId, name, artist || '', category || '', url || '', coverUrl || '', duration || 0, Date.now());
  res.json({ code: 0 });
});

app.delete('/api/db/music/:id', (req, res) => {
  const { userId } = req.query;
  stmts.deleteCustomMusic.run(req.params.id, userId);
  res.json({ code: 0 });
});

app.get('/api/db/settings/:userId', (req, res) => {
  const settings = stmts.getSettings.get(req.params.userId);
  res.json({ code: 0, settings: settings || null });
});

app.post('/api/db/settings', (req, res) => {
  const { userId, selectedScene, selectedMusic, volume, externalVolume, pomodoroWork, pomodoroBreak, theme } = req.body;
  if (!userId) return res.json({ code: -1, msg: '缺少参数' });
  stmts.upsertSettings.run(userId, selectedScene || 'cafe', selectedMusic || 'rain', volume ?? 50, externalVolume ?? 50, pomodoroWork ?? 25, pomodoroBreak ?? 5, theme || 'dark', Date.now());
  res.json({ code: 0 });
});

app.get('/api/db/stats/:userId', (req, res) => {
  const stats = stmts.getStats.get(req.params.userId);
  res.json({ code: 0, stats: stats || null });
});

app.post('/api/db/stats', (req, res) => {
  const { userId, totalSessions, totalMinutes, currentStreak, bestStreak, lastStudyDate, todayStudySeconds, todayPomodoroCount, streakDays } = req.body;
  if (!userId) return res.json({ code: -1, msg: '缺少参数' });
  stmts.upsertStats.run(userId, totalSessions ?? 0, totalMinutes ?? 0, currentStreak ?? 0, bestStreak ?? 0, lastStudyDate || null, todayStudySeconds ?? 0, todayPomodoroCount ?? 0, streakDays ?? 0, Date.now());
  res.json({ code: 0 });
});

app.get('/api/db/favorites/scenes/:userId', (req, res) => {
  const rows = stmts.getFavoriteScenes.all(req.params.userId);
  res.json({ code: 0, favorites: rows.map(r => r.scene_id) });
});

app.post('/api/db/favorites/scenes', (req, res) => {
  const { userId, sceneId, action } = req.body;
  if (action === 'remove') stmts.removeFavoriteScene.run(userId, sceneId);
  else stmts.addFavoriteScene.run(userId, sceneId);
  res.json({ code: 0 });
});

app.get('/api/db/favorites/music/:userId', (req, res) => {
  const rows = stmts.getFavoriteMusic.all(req.params.userId);
  res.json({ code: 0, favorites: rows.map(r => r.music_id) });
});

app.post('/api/db/favorites/music', (req, res) => {
  const { userId, musicId, action } = req.body;
  if (action === 'remove') stmts.removeFavoriteMusic.run(userId, musicId);
  else stmts.addFavoriteMusic.run(userId, musicId);
  res.json({ code: 0 });
});

app.get('/api/db/history/:userId', (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const history = stmts.getHistory.all(req.params.userId, limit);
  res.json({ code: 0, history });
});

app.post('/api/db/history', (req, res) => {
  const { userId, date, duration, type } = req.body;
  if (!userId || !date || !duration) return res.json({ code: -1, msg: '缺少参数' });
  stmts.insertHistory.run(userId, date, duration, type || '');
  res.json({ code: 0 });
});

app.listen(PORT, () => {
  console.log(`Music API server running on http://localhost:${PORT}`);
});
