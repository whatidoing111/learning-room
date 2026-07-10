import { useStore } from '@/store/useStore';
import type { ActiveTab } from '@/store/useStore';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/UI/GlassCard';
import TimerControl from './TimerControl';
import PomodoroControl from './PomodoroControl';
import NoiseControl from './NoiseControl';
import Stats from '@/components/UI/Stats';
import { Clock, Timer, Music, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tabs: { key: ActiveTab; icon: typeof Clock; label: string }[] = [
  { key: 'timer', icon: Clock, label: '计时器' },
  { key: 'pomodoro', icon: Timer, label: '番茄钟' },
  { key: 'noise', icon: Music, label: '白噪音' },
  { key: 'stats', icon: BarChart3, label: '统计' },
];

export default function ControlPanel() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const panelExpanded = useStore((s) => s.panelExpanded);
  const togglePanel = useStore((s) => s.togglePanel);

  const PanelIcon = panelExpanded ? ChevronDown : ChevronUp;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
      <GlassCard className="overflow-hidden">
        <button
          onClick={togglePanel}
          className="flex w-full items-center justify-center gap-1.5 py-2 text-white/60 transition-colors hover:text-white"
        >
          <PanelIcon size={16} />
          <span className="text-xs">控制面板</span>
        </button>

        <AnimatePresence>
          {panelExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-center gap-1 border-b border-white/10 px-2 pb-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition-all duration-200',
                        activeTab === tab.key
                          ? 'bg-white/20 text-white shadow-sm'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/10'
                      )}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === 'timer' && <TimerControl />}
                    {activeTab === 'pomodoro' && <PomodoroControl />}
                    {activeTab === 'noise' && <NoiseControl />}
                    {activeTab === 'stats' && <Stats />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
