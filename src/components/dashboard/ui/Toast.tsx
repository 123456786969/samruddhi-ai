import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9);
      const duration = options.duration ?? 5000;
      const newToast: ToastItem = { ...options, id, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: 'success', title, message }),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string) => addToast({ type: 'error', title, message }),
    [addToast]
  );
  const info = useCallback(
    (title: string, message?: string) => addToast({ type: 'info', title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto bg-[#141414] border border-[rgba(255,255,255,0.12)] rounded-[12px] shadow-2xl p-3.5 flex items-start gap-3 relative overflow-hidden"
            >
              {/* Left Accent Icon */}
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />}
                {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#F87171]" />}
                {t.type === 'info' && <Info className="w-4 h-4 text-[#D4AF37]" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-semibold text-[#F4F4F5] leading-tight">{t.title}</p>
                {t.message && (
                  <p className="text-xs text-[#A1A1AA] mt-0.5 leading-snug line-clamp-2">
                    {t.message}
                  </p>
                )}
              </div>

              {/* Undo action button */}
              {t.undoAction && (
                <button
                  onClick={() => {
                    t.undoAction?.();
                    dismiss(t.id);
                  }}
                  className="px-2 py-1 text-xs font-semibold text-[#D4AF37] hover:text-[#E5C358] bg-[rgba(212,175,55,0.12)] hover:bg-[rgba(212,175,55,0.2)] rounded-[6px] border border-[rgba(212,175,55,0.3)] transition-colors shrink-0"
                >
                  {t.undoLabel || 'Undo'}
                </button>
              )}

              {/* Close button */}
              <button
                onClick={() => dismiss(t.id)}
                className="text-[#71717A] hover:text-[#F4F4F5] p-0.5 rounded transition-colors shrink-0"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const defaultToastContext: ToastContextType = {
  toast: (options) => {
    console.info('[Toast] ', options.title, options.message);
    return 'fallback';
  },
  success: (title, message) => {
    console.info('[Toast:Success] ', title, message);
    return 'fallback';
  },
  error: (title, message) => {
    console.error('[Toast:Error] ', title, message);
    return 'fallback';
  },
  info: (title, message) => {
    console.info('[Toast:Info] ', title, message);
    return 'fallback';
  },
  dismiss: () => {},
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    return defaultToastContext;
  }
  return context;
};
