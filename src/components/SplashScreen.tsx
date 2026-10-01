import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Unmount exactly at 3.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 1, 0] }}
          transition={{ duration: 3.5, times: [0, 0.85, 1], ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-none"
        >
          <div className="flex flex-col items-center text-center px-4">
            {/* Logo: Fades in at 0.0s, Fades out at 3.0s */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, 0] }}
              transition={{ 
                duration: 3.5, 
                times: [0, 0.2, 0.85, 1], // 0.2 * 3.5 = 0.7s (fade in), 0.85 * 3.5 = ~3.0s (start fade out)
                ease: "easeInOut"
              }}
              className="text-4xl md:text-6xl lg:text-7xl font-serif text-white tracking-[0.2em] uppercase drop-shadow-lg"
            >
              <span className="text-amber-400">Samruddhi</span> AI
            </motion.h1>

            {/* Tagline: Fades in at 1.2s, Fades out at 3.0s */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: [0, 0, 1, 1, 0], y: [5, 5, 0, 0, 0] }}
              transition={{ 
                duration: 3.5, 
                times: [0, 0.34, 0.45, 0.85, 1], // 0.34 * 3.5 = ~1.2s (start fade in), 0.85 * 3.5 = ~3.0s (start fade out)
                ease: "easeInOut"
              }}
              className="mt-6 text-sm md:text-lg lg:text-xl text-gray-400 tracking-widest font-light"
            >
              Turning missed calls into closed properties.
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
