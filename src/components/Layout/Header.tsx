import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { User } from 'lucide-react';

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/scenes', label: '场景' },
  { to: '/music', label: '音乐' },
  { to: '/room', label: '学习室' },
];

export default function Header() {
  const user = useStore((s) => s.user);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold text-white">
          学习室
        </Link>
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="h-4 w-px bg-white/10" />
          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            {user ? (
              <>
                <img src={user.avatar} alt={user.username} className="h-6 w-6 rounded-full border border-white/10" />
                <span className="max-w-[60px] truncate">{user.username}</span>
              </>
            ) : (
              <>
                <User size={16} />
                <span>我的</span>
              </>
            )}
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
