import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-neutral-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(192,38,211,0.2)]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-fuchsia-500" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">Yêu cầu đăng nhập</h3>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Bạn cần đăng nhập để truy cập vào khu vực này. Hãy tham gia ngay để không bỏ lỡ các giải đấu hấp dẫn!
          </p>

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
            >
              Để sau
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Đăng nhập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
