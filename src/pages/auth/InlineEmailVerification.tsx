import { ArrowRight, CheckCircle, Mail, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const InlineEmailVerification = ({ email }) => {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = () => {
    setCountdown(60); 
    // Logic gửi lại mail
  };

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in-up py-10">
      
      {/* Icon Envelope Nổi bật */}
      <div className="mb-8 relative inline-block">
        <div className="absolute inset-0 bg-fuchsia-500/30 blur-xl rounded-full"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-neutral-800 to-black rounded-full border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
          <Mail className="w-10 h-10 text-fuchsia-500 animate-bounce-slow" />
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-black rounded-full p-1.5 border-4 border-black">
            <CheckCircle size={18} strokeWidth={3} />
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-extrabold mb-4 text-white">Kiểm tra hộp thư!</h2>
      
      <p className="text-gray-400 mb-2 text-lg">
        Chúng tôi đã gửi liên kết xác thực đến:
      </p>
      
      <div className="bg-neutral-900 border border-fuchsia-500/30 rounded-lg py-3 px-6 mb-8 text-fuchsia-300 font-mono text-lg font-bold shadow-[0_0_15px_rgba(192,38,211,0.15)]">
        {email || 'champion@example.com'}
      </div>

      <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">
        Vui lòng bấm vào link trong email để kích hoạt tài khoản trước khi đăng nhập.
      </p>

      {/* Nút chính dẫn về Login */}
      <a 
        href="/login" 
        className="w-full py-4 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(192,38,211,0.4)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        Quay về trang Đăng nhập
        <ArrowRight className="w-5 h-5" />
      </a>

      {/* Nút gửi lại */}
      <div className="mt-6 text-sm">
        <span className="text-gray-500">Chưa nhận được? </span>
        <button 
          onClick={handleResend} 
          disabled={countdown > 0} 
          className={`font-semibold transition-colors inline-flex items-center gap-1 ml-1 ${countdown > 0 ? 'text-gray-600 cursor-not-allowed' : 'text-fuchsia-400 hover:text-fuchsia-300 hover:underline'}`}
        >
          {countdown > 0 ? <><RefreshCw className="w-3 h-3 animate-spin" /> Gửi lại sau {countdown}s</> : 'Gửi lại ngay'}
        </button>
      </div>

    </div>
  );
};

export default InlineEmailVerification;