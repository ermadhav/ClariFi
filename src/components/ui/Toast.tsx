'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

let addToastExternal: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function showToast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  addToastExternal?.({ message, type, duration });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastExternal = (toast) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 4000);
    };
    return () => { addToastExternal = null; };
  }, []);

  const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info };
  const colors = {
    success: 'border-profit/30 bg-profit/10',
    error: 'border-loss/30 bg-loss/10',
    warning: 'border-warning/30 bg-warning/10',
    info: 'border-indigo-500/30 bg-indigo-500/10',
  };
  const iconColors = { success: 'text-profit', error: 'text-loss', warning: 'text-warning', info: 'text-indigo-400' };

  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg ${colors[t.type]}`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${iconColors[t.type]}`} />
              <span className="text-sm text-foreground flex-1">{t.message}</span>
              <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="p-0.5 rounded hover:bg-white/10">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
