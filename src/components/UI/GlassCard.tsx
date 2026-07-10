import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg',
        'dark:border-white/10 dark:bg-white/5',
        className
      )}
    >
      {children}
    </div>
  );
}
