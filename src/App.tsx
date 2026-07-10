import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const SceneSelect = lazy(() => import('./pages/SceneSelect'));
const MusicSelect = lazy(() => import('./pages/MusicSelect'));
const StudyRoom = lazy(() => import('./pages/StudyRoom'));
const Profile = lazy(() => import('./pages/Profile'));

function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0f0a]">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400 mx-auto" />
        <p className="font-serif text-lg text-amber-400/80">加载中...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scenes" element={<SceneSelect />} />
          <Route path="/music" element={<MusicSelect />} />
          <Route path="/room" element={<StudyRoom />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
