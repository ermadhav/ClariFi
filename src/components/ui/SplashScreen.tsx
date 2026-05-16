'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-[#09090b] flex items-center justify-center z-[100]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20"
        >
          <Zap className="w-10 h-10 text-white" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-bold gradient-text mb-2">
          ClariFi
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm text-muted-foreground mb-8">
          Your Premium Portfolio Tracker
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="w-48 mx-auto">
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" animate={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2">Loading your portfolio...</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
