import React, { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-rose-50 border-rose-200",
    info: "bg-sky-50 border-sky-200",
  };

  const textColor = {
    success: "text-emerald-800",
    error: "text-rose-800",
    info: "text-sky-800",
  };

  const Icon = {
    success: CheckCircle2,
    error: XCircle,
    info: AlertCircle,
  };

  const iconColor = {
    success: "text-emerald-600",
    error: "text-rose-600",
    info: "text-sky-600",
  };

  const CurrentIcon = Icon[type];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg ${bgColor[type]}`}
        style={{
          animation: "slideInRight 0.3s ease-out",
        }}
      >
        <CurrentIcon className={`w-5 h-5 flex-shrink-0 ${iconColor[type]}`} />
        <p className={`flex-1 text-sm font-medium ${textColor[type]}`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={`p-1 rounded hover:bg-white/50 transition ${textColor[type]}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
