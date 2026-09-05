import { useEffect, useRef } from 'react';
import { AlertCircle, HelpCircle, LogOut, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'logout';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  const tombolBatalRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    tombolBatalRef.current?.focus();
    const tanganiEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };
    document.addEventListener('keydown', tanganiEscape);
    return () => document.removeEventListener('keydown', tanganiEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Render icon based on type
  const renderIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-6 h-6 text-orange-600" />
          </div>
        );
      case 'logout':
        return (
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-6 h-6 text-slate-600" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      case 'logout':
        return 'bg-slate-800 hover:bg-slate-900 text-white';
      case 'info':
      default:
        return 'bg-[#0A3D2D] hover:bg-[#082d22] text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-[999] flex items-center justify-center p-4 backdrop-blur-sm" role="presentation">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200" role="dialog" aria-modal="true" aria-labelledby="dialog-judul" aria-describedby="dialog-pesan">
        
        {renderIcon()}
        
        <h3 id="dialog-judul" className="text-xl font-bold text-center text-slate-800 mb-2">{title}</h3>
        <p id="dialog-pesan" className="text-slate-500 text-center text-sm mb-6 leading-relaxed whitespace-pre-wrap">
          {message}
        </p>
        
        <div className="flex gap-3">
          <button 
            ref={tombolBatalRef}
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 ${getConfirmButtonClass()}`}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
