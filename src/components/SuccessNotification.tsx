import { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessNotificationProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function SuccessNotification({
  show,
  onClose,
  title = 'Erfolgreich genehmigt',
  description = 'Der Einverständnisbogen wurde genehmigt und das PDF erstellt.',
}: SuccessNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
      const timer = setTimeout(() => {
        setAnimating(false);
        setTimeout(() => { setVisible(false); onClose(); }, 400);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`
          relative overflow-hidden rounded-2xl p-5 min-w-[320px] max-w-[400px]
          border border-white/10
          bg-slate-900/95
          backdrop-blur-xl
          shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]
          transition-all duration-400 ease-out
          ${animating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
        `}
      >
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-emerald-500/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-600/20 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-50 tracking-wide">{title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">{description}</p>
          </div>

          {/* Close */}
          <button
            onClick={() => { setAnimating(false); setTimeout(() => { setVisible(false); onClose(); }, 400); }}
            className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-white/40 hover:text-white/70" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-emerald-400/60 to-amber-400/40 rounded-full"
            style={{
              animation: animating ? 'shrinkWidth 4s linear forwards' : 'none',
            }}
          />
        </div>

        <style>{`
          @keyframes shrinkWidth {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
}
