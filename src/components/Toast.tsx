import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type = 'success', onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = 
    type === 'success' ? 'bg-neutral-900 border-green-500/50' : 
    type === 'error' ? 'bg-neutral-900 border-red-500/50' : 
    'bg-neutral-900 border-fuchsia-500/50';

  const iconColor = 
    type === 'success' ? 'text-green-500' : 
    type === 'error' ? 'text-red-500' : 
    'text-fuchsia-500';

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : CheckCircle;

  return (
    <div className={`fixed top-24 right-8 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-fade-in-left ${bgColor} min-w-[300px]`}>
      <Icon className={iconColor} size={20} />
      <p className="flex-1 text-sm font-medium text-white">{message}</p>
      <button 
        onClick={onClose}
        className="text-gray-500 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
