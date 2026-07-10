import { useCallback } from 'react';
import { useStore } from '../store/useStore';

export function useTodo() {
  const { todos, addTodo, toggleTodo, removeTodo } = useStore();

  const add = useCallback((text: string) => {
    if (text.trim()) {
      addTodo(text.trim());
    }
  }, [addTodo]);

  const toggle = useCallback((id: string) => {
    toggleTodo(id);
  }, [toggleTodo]);

  const deleteTodo = useCallback((id: string) => {
    removeTodo(id);
  }, [removeTodo]);

  return { todos, addTodo: add, toggleTodo: toggle, deleteTodo };
}