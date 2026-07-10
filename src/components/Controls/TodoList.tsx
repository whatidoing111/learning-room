import { useState } from 'react';
import { useTodo } from '../../hooks/useTodo';
import { Plus, Trash2, Check, ListTodo } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TodoList() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodo();
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    addTodo(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo size={16} className="text-white/40" />
          <h3 className="text-sm font-medium text-white/60">待办任务</h3>
        </div>
        {totalCount > 0 && (
          <span className="text-xs text-white/30">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        <AnimatePresence initial={false} mode="popLayout">
          {todos.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <div className="mb-2 text-2xl opacity-20">📝</div>
              <p className="text-xs text-white/20">暂无待办任务</p>
            </motion.div>
          )}
          {todos.map((todo, index) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9, filter: 'blur(4px)' }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/5"
            >
              <motion.button
                onClick={() => toggleTodo(todo.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                  todo.completed
                    ? 'border-emerald-400/50 bg-emerald-400/20 text-emerald-300'
                    : 'border-white/15 bg-transparent text-transparent hover:border-white/25'
                }`}
              >
                {todo.completed && <Check size={10} />}
              </motion.button>
              <span
                className={`min-w-0 flex-1 truncate text-sm transition-all ${
                  todo.completed
                    ? 'text-white/25 line-through'
                    : 'text-white/70'
                }`}
              >
                {todo.text}
              </span>
              <motion.button
                onClick={() => deleteTodo(todo.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="shrink-0 text-white/0 transition-all hover:text-red-400/60 group-hover:text-white/20"
              >
                <Trash2 size={12} />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-white/5 p-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加新任务..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-white/20 outline-none"
        />
        <motion.button
          onClick={handleAdd}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!input.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-all hover:bg-white/15 disabled:opacity-30"
        >
          <Plus size={14} />
        </motion.button>
      </div>
    </div>
  );
}