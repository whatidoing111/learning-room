export interface Scene {
  id: string;
  name: string;
  emoji: string;
  description: string;
  image: string;
  video?: string;
}

export const scenes: Scene[] = [
  {
    id: 'library',
    name: '古典图书馆',
    emoji: '📚',
    description: '温暖的木质书架，柔和的台灯光，安静的翻书声',
    image: '/images/scenes/library.jpg',
  },
  {
    id: 'cafe',
    name: '咖啡馆',
    emoji: '☕',
    description: '弥漫着咖啡香气的角落，轻柔的背景音乐',
    image: '/images/scenes/cafe.jpeg',
  },
  {
    id: 'forest',
    name: '森林小屋',
    emoji: '🌲',
    description: '被绿意环绕的木屋，鸟鸣与溪流声',
    image: '/images/scenes/forest.jpg',
  },
  {
    id: 'ocean',
    name: '海边书房',
    emoji: '🌊',
    description: '面朝大海的落地窗，海浪轻拍沙滩的声音',
    image: '/images/scenes/ocean.jpeg',
  },
  {
    id: 'rainy',
    name: '雨天窗边',
    emoji: '🌧️',
    description: '窗外淅沥的雨声，温暖的室内灯光',
    image: '/images/scenes/rainy.jpg',
    video: '/videos/rainy.mp4',
  },
  {
    id: 'night',
    name: '星空自习室',
    emoji: '🌙',
    description: '深夜的宁静，星空下的专注时刻',
    image: '/images/scenes/night.jpeg',
  },
  {
    id: 'garden',
    name: '花园阳台',
    emoji: '🌸',
    description: '阳光透过花丛洒落，微风带来花香',
    image: '/images/scenes/garden.jpg',
  },
  {
    id: 'mountain',
    name: '山间禅房',
    emoji: '🏔️',
    description: '远离喧嚣的山中静室，清风与松涛',
    image: '/images/scenes/mountain.jpg',
  },
];
