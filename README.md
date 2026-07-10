# 学习室 - 沉浸式虚拟自习空间

一个基于 React + TypeScript 的沉浸式学习环境，提供场景背景、音乐播放、番茄钟、倒计时、待办事项等功能，帮助你专注学习。

## 功能概览

### 场景系统
- 8 个内置场景：古典图书馆、咖啡馆、森林小屋、海边书房、雨天窗边、星空自习室、花园阳台、山间禅房
- 支持静态图片和动态视频壁纸（如雨天场景使用视频循环播放）
- 支持自定义添加场景，上传自己的图片或视频

### 音乐播放
- 20 首内置环境音乐，分为自然声音、白噪音、轻音乐、Lo-fi 四类
- 支持自定义添加音乐，上传本地音频文件
- 网易云音乐登录：扫码登录后可浏览歌单、搜索歌曲、在线播放
- QQ 音乐登录：扫码登录后可浏览推荐歌单、搜索歌曲、在线播放
- 音量独立控制，内置音乐和在线音乐分开调节

### 番茄钟 & 倒计时
- 番茄钟：自定义工作/休息时长，自动循环
- 倒计时：设定目标时间，倒计时结束提醒
- 两个计时器可自由切换

### 待办事项
- 添加、完成、删除待办任务
- 任务完成动画和删除动画
- 数据自动同步到后端数据库

### 数据持久化
- SQLite 数据库存储用户数据
- 登录后自动同步：待办事项、自定义场景、自定义音乐、设置偏好
- localStorage 作为离线回退

### 界面特性
- 居中时钟显示
- 可拖拽、可缩放的功能面板
- 响应式布局，窗口缩放时自动调整位置
- 毛玻璃风格 UI

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 路由 | React Router v7 |
| 状态管理 | Zustand |
| 动画 | Framer Motion |
| 样式 | Tailwind CSS |
| 图标 | Lucide React |
| 后端 | Express.js |
| 数据库 | SQLite (better-sqlite3) |
| 音乐 API | NeteaseCloudMusicApi |

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆项目
git clone https://github.com/whatidoing111/learning-room.git
cd learning-room

# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 启动

需要同时启动前端和后端两个服务：

```bash
# 终端 1：启动后端服务（端口 3000）
node server/index.js

# 终端 2：启动前端开发服务器（端口 5173）
npm run dev
```

打开浏览器访问 http://localhost:5173/

### 构建部署

```bash
npm run build
```

构建产物在 `dist/` 目录，可部署到任意静态服务器。

## 使用教程

### 1. 首页
访问首页后，输入你的用户名登录。登录后数据会自动保存到后端数据库。

### 2. 选择场景
点击「选择场景」进入场景选择页面：
- 浏览 8 个内置场景，点击即可选中
- 点击「自定义」可以添加自己的场景（需要上传图片，可选上传视频作为动态壁纸）

### 3. 选择音乐
点击「选择音乐」进入音乐选择页面：
- 按分类浏览内置音乐：自然声音、白噪音、轻音乐、Lo-fi
- 点击「自定义」可以添加自己的音乐（上传音频文件）
- 点击「网易云音乐」或「QQ 音乐」扫码登录在线音乐平台

### 4. 进入学习室
选择好场景和音乐后，点击「进入学习室」：

- **左下角 - 音乐播放器**：控制音乐播放、切换曲目、调节音量
- **右上角 - 计时器**：切换番茄钟/倒计时模式
- **右下角 - 待办事项**：管理学习任务
- **中央 - 时钟**：显示当前时间

所有面板支持拖拽移动和缩放，窗口大小变化时会自动调整位置。

### 5. 更换场景图片/视频

场景图片存放在 `public/images/scenes/`，视频存放在 `public/videos/`。

修改 `src/data/scenes.ts` 中对应场景的字段即可：

```ts
{
  id: 'ocean',
  name: '海边书房',
  emoji: '🌊',
  description: '面朝大海的落地窗，海浪轻拍沙滩的声音',
  image: '/images/scenes/ocean.jpeg',   // 静态图片（用于预览）
  video: '/videos/ocean.mp4',           // 可选，动态视频壁纸
},
```

### 6. 更换音乐音源

音乐文件存放在 `public/music/`。

修改 `src/data/music.ts` 中对应音乐的 `url` 字段即可：

```ts
{ id: 'rain', name: '雨声', emoji: '🌧️', description: '窗外淅沥的小雨', category: 'nature', url: '/music/rain.ogg' },
```

支持的音频格式：mp3、ogg、wav、m4a 等浏览器支持的格式。

## 项目结构

```
learning-room/
├── public/
│   ├── icons/          # 平台图标（网易云、QQ音乐）
│   ├── images/scenes/  # 场景图片
│   ├── music/          # 内置音乐文件
│   └── videos/         # 场景视频壁纸
├── server/
│   ├── index.js        # Express 后端服务
│   ├── db.js           # SQLite 数据库模块
│   └── package.json    # 后端依赖
├── src/
│   ├── api/db.ts       # 数据库 API 封装
│   ├── components/
│   │   ├── Controls/   # 功能组件（音乐、番茄钟、待办等）
│   │   ├── Home/       # 首页组件
│   │   └── UI/         # 通用 UI 组件
│   ├── data/
│   │   ├── scenes.ts   # 场景数据
│   │   └── music.ts    # 音乐数据
│   ├── pages/          # 页面组件
│   ├── store/useStore.ts # Zustand 全局状态
│   └── App.tsx         # 路由配置
├── .gitignore
├── package.json
└── README.md
```

## 后端 API

后端服务运行在 `http://localhost:3000`，提供以下接口：

### 网易云音乐
| 接口 | 说明 |
|------|------|
| `GET /api/login/qr/key` | 获取二维码 key |
| `GET /api/login/qr/create` | 生成二维码 |
| `GET /api/login/qr/check` | 检查扫码状态 |
| `GET /api/login/status` | 登录状态 |
| `GET /api/user/playlist` | 用户歌单 |
| `GET /api/playlist/detail` | 歌单详情 |
| `GET /api/search` | 搜索歌曲 |
| `GET /api/song/url` | 获取播放链接 |
| `GET /api/lyric` | 获取歌词 |

### QQ 音乐
| 接口 | 说明 |
|------|------|
| `GET /api/qq/qr/create` | 获取二维码 |
| `GET /api/qq/qr/check` | 检查扫码状态 |
| `GET /api/qq/user/info` | 用户信息 |
| `GET /api/qq/playlist/recommend` | 推荐歌单 |
| `GET /api/qq/playlist/tracks` | 歌单歌曲 |
| `GET /api/qq/search` | 搜索歌曲 |
| `GET /api/qq/song/url` | 获取播放链接 |

### 数据库
| 接口 | 说明 |
|------|------|
| `GET /api/db/user/:id` | 获取用户 |
| `POST /api/db/user` | 创建用户 |
| `GET /api/db/todos/:userId` | 获取待办 |
| `POST /api/db/todos` | 添加待办 |
| `PUT /api/db/todos/:id` | 更新待办 |
| `DELETE /api/db/todos/:id` | 删除待办 |
| `GET /api/db/scenes/:userId` | 自定义场景 |
| `POST /api/db/scenes` | 添加场景 |
| `DELETE /api/db/scenes/:id` | 删除场景 |
| `GET /api/db/music/:userId` | 自定义音乐 |
| `POST /api/db/music` | 添加音乐 |
| `DELETE /api/db/music/:id` | 删除音乐 |
| `GET /api/db/settings/:userId` | 用户设置 |
| `PUT /api/db/settings/:userId` | 更新设置 |

## License

MIT
