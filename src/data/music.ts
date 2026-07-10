export interface Music {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: MusicCategory;
  url?: string;
}

export type MusicCategory = 'all' | 'nature' | 'whitenoise' | 'light' | 'lofi';

export const musicCategories: { key: MusicCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'nature', label: '自然声音' },
  { key: 'whitenoise', label: '白噪音' },
  { key: 'light', label: '轻音乐' },
  { key: 'lofi', label: 'Lo-fi' },
];

export const musicList: Music[] = [
  { id: 'rain', name: '雨声', emoji: '🌧️', description: '窗外淅沥的小雨，令人心安', category: 'nature', url: '/music/rain.ogg' },
  { id: 'ocean', name: '海浪', emoji: '🌊', description: '海浪拍打沙滩的节奏', category: 'nature', url: '/music/ocean.mp3' },
  { id: 'forest', name: '森林', emoji: '🌲', description: '林间鸟鸣与树叶沙沙声', category: 'nature', url: '/music/sen.ogg' },
  { id: 'thunder', name: '雷雨', emoji: '⛈️', description: '远处的雷声与大雨', category: 'nature', url: '/music/thunder.ogg' },
  { id: 'fire', name: '篝火', emoji: '🔥', description: '柴火噼啪作响的温暖', category: 'nature', url: '/music/fire.mp3' },
  { id: 'bird', name: '鸟鸣', emoji: '🐦', description: '清晨的鸟语花香', category: 'nature', url: '/music/bird.mp3' },
  { id: 'wind', name: '风声', emoji: '💨', description: '轻柔的微风吹过', category: 'nature', url: '/music/wind.mp3' },
  { id: 'stream', name: '溪流', emoji: '💧', description: '山间溪水潺潺流淌', category: 'nature', url: '/music/stream.mp3' },
  { id: 'white', name: '白噪音', emoji: '📻', description: '均匀的白噪音背景', category: 'whitenoise', url: '/music/white.mp3' },
  { id: 'pink', name: '粉噪音', emoji: '🎀', description: '柔和的粉红噪音', category: 'whitenoise', url: '/music/pink.mp3' },
  { id: 'brown', name: '棕噪音', emoji: '🟤', description: '深沉的棕色噪音', category: 'whitenoise', url: '/music/brown.mp3' },
  { id: 'fan', name: '风扇声', emoji: '🌀', description: '旋转风扇的嗡嗡声', category: 'whitenoise', url: '/music/fan.mp3' },
  { id: 'piano', name: '钢琴曲', emoji: '🎹', description: '舒缓的钢琴旋律', category: 'light', url: '/music/piano.mp3' },
  { id: 'violin', name: '小提琴', emoji: '🎻', description: '悠扬的小提琴独奏', category: 'light', url: '/music/violin.mp3' },
  { id: 'guitar', name: '吉他', emoji: '🎸', description: '轻柔的民谣吉他', category: 'light', url: '/music/guitar.mp3' },
  { id: 'classical', name: '古典乐', emoji: '🎼', description: '优雅的古典乐章', category: 'light', url: '/music/classical.mp3' },
  { id: 'lofi-beats', name: 'Lo-fi Beats', emoji: '🎧', description: '慵懒的 Lo-fi 节拍', category: 'lofi', url: '/music/lofi-beats.mp3' },
  { id: 'chillhop', name: 'Chillhop', emoji: '🎵', description: '轻松的 Chillhop 旋律', category: 'lofi', url: '/music/chillhop.mp3' },
  { id: 'jazz-hop', name: 'Jazz Hop', emoji: '🎷', description: '爵士风格的嘻哈节拍', category: 'lofi', url: '/music/jazz-hop.mp3' },
  { id: 'ambient', name: '氛围电子', emoji: '🌌', description: '空灵的氛围电子音乐', category: 'lofi', url: '/music/ambient.mp3' },
];
