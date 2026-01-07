import React, { useState } from 'react';
import { Swords, Mail, Lock, User, CheckCircle, ArrowRight, ArrowLeft, Shield, Zap, RefreshCw } from 'lucide-react';
import InlineEmailVerification from './InlineEmailVerification';
import { supabase } from '../../lib/supabase';

/* --- MAIN PAGE --- */
const SignUpPage = () => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false); // State quan trọng để thay thế nội dung
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleNext = () => { if (formData.displayName && formData.email) setStep(2); };
  const handleBack = () => { setStep(1); };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
          },
        },
      });

      if (error) throw error;

      // Success logic
      setIsSubmitted(true); // Kích hoạt thay thế nội dung Form
    } catch (err: any) {
      alert(err.message || "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black text-white font-sans selection:bg-fuchsia-500 selection:text-white">
      
      {/* --- LEFT SIDE: FORM AREA (TECH-PREMIUM STYLE) --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 bg-black">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
        
        {/* Scanline Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent animate-scanline-fast"></div>
        </div>
        
        <div className="max-w-md w-full mx-auto mt-12 min-h-[500px] flex flex-col justify-center relative">
          {/* HUD Corner Accents */}
          <div className="absolute -top-4 -left-4 w-16 h-16 border-t-2 border-l-2 border-fuchsia-500/30 pointer-events-none"></div>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 border-b-2 border-r-2 border-fuchsia-500/30 pointer-events-none"></div>
          
          {/* --- LOGIC: IF SUBMITTED -> SHOW VERIFY, ELSE -> SHOW FORM --- */}
          {isSubmitted ? (
            /* 1. VERIFY EMAIL VIEW */
            <InlineEmailVerification email={formData.email} />
          ) : (
            /* 2. SIGN UP FORM (Step 1 & 2) */
            <>
              {/* Header & Progress Bar */}
              <div className="mb-10 animate-fade-in relative">
                {/* Tech Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-4">
                  <span className="w-1 h-3 bg-fuchsia-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">// Registration Portal</span>
                </div>
                
                <h1 className="text-5xl font-black mb-3 uppercase italic tracking-tighter">
                  Gia nhập <span className="text-fuchsia-500">Đấu trường</span>
                </h1>
                <div className="h-0.5 w-32 bg-gradient-to-r from-fuchsia-600 to-transparent mb-6"></div>
                
                {/* Progress Steps */}
                <div className="flex items-center gap-3 text-xs font-black text-gray-600 mb-3 uppercase tracking-wider">
                  <span className={step === 1 ? "text-fuchsia-500" : "text-green-500"}>Bước 1: Định danh</span>
                  <ArrowRight size={14} className="text-gray-700"/>
                  <span className={step === 2 ? "text-fuchsia-500" : "text-gray-700"}>Bước 2: Bảo mật</span>
                </div>
                
                {/* Progress Bar */}
                <div className="h-1 w-full bg-neutral-900 border border-white/5 overflow-hidden relative">
                  <div className={`h-full bg-fuchsia-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(192,38,211,0.5)] ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                </div>
              </div>

              {/* Form Input Container */}
              <form className="space-y-8 relative overflow-hidden min-h-[320px]">
                
                {/* --- STEP 1 --- */}
                <div className={`transition-all duration-500 ease-in-out absolute w-full mt-1  ${step === 1 ? 'opacity-100 translate-x-0 relative' : 'opacity-0 -translate-x-full absolute pointer-events-none'}`}>
                  <div className="relative z-0 w-full group mb-8">
                    <input type="text" name="displayName" required value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " />
                    <label className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 font-bold uppercase tracking-wider text-xs">Tên nhân vật</label>
                    <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors"><User className="w-5 h-5" /></div>
                  </div>
                  <div className="relative z-0 w-full group">
                    <input type="email" name="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " />
                    <label className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 font-bold uppercase tracking-wider text-xs">Email</label>
                    <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors"><Mail className="w-5 h-5" /></div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className="mt-12 w-full py-5 px-4 bg-white text-black hover:bg-gray-200 font-black text-xs uppercase tracking-[0.3em] transition-all hover:translate-y-[-2px] flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(255,255,255,0.1)] relative overflow-hidden"
                    style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    Tiếp tục <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* --- STEP 2 --- */}
                <div className={`transition-all duration-500 ease-in-out absolute w-full ${step === 2 ? 'opacity-100 translate-x-0 relative' : 'opacity-0 translate-x-full absolute pointer-events-none'}`}>
                  <div className="relative z-0 w-full group mb-8">
                    <input type="password" name="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " />
                    <label className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 font-bold uppercase tracking-wider text-xs">Mật khẩu</label>
                    <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors"><Lock className="w-5 h-5" /></div>
                  </div>
                  <div className="relative z-0 w-full group">
                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " />
                    <label className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 font-bold uppercase tracking-wider text-xs">Xác nhận mật khẩu</label>
                    <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors"><Shield className="w-5 h-5" /></div>
                  </div>
                  
                  <div className="mt-12 flex gap-4">
                    <button 
                      type="button" 
                      onClick={handleBack} 
                      className="w-1/3 py-5 px-4 bg-black border border-white/10 text-gray-500 hover:text-white hover:border-fuchsia-500/50 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                      <ArrowLeft className="w-5 h-5" /> Quay lại
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSubmit} 
                      disabled={isLoading}
                      className="w-2/3 py-5 px-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(192,38,211,0.4)] hover:shadow-[0_0_40px_rgba(192,38,211,0.6)] transition-all hover:translate-y-[-2px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      {isLoading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Đang xử lý...</> : <>Hoàn thành <CheckCircle className="w-5 h-5" /></>}
                    </button>
                  </div>
                </div>
              </form>

              <div className="text-center text-sm text-gray-600">
                 Đã là thành viên? <a href="/login" className="text-fuchsia-500 hover:text-fuchsia-400 font-black hover:underline uppercase tracking-wider">Đăng nhập ngay</a>
              </div>
            </>
          )}

        </div>
      </div>

      {/* --- RIGHT SIDE: TECH-PREMIUM COVER --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-950 justify-center items-center text-center p-16">
        {/* Background Image */}
        <div className="absolute inset-0 z-0" style={{ backgroundImage: `url("https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1887&auto=format&fit=crop")`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-900/40 to-black/80 z-10 mix-blend-multiply"></div>
        
        {/* HUD Frame Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-fuchsia-500/30 z-30"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-fuchsia-500/30 z-30"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-fuchsia-500/30 z-30"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-fuchsia-500/30 z-30"></div>
        
        {/* Scanline Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-40">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent animate-scanline-fast"></div>
        </div>
        
        {/* Spotlight */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[120px] z-10 animate-pulse"></div>
        
        {/* Content Box */}
        <div className="relative z-20 backdrop-blur-md bg-black/40 border border-fuchsia-500/20 p-10 max-w-lg shadow-2xl overflow-hidden"
             style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
          {/* Inner HUD Corners */}
          <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-fuchsia-500/30"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-fuchsia-500/30"></div>
          
          {/* Tech Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-black uppercase tracking-[0.3em] mb-6">
            <Zap className="w-3 h-3" /> <span>New Season Started</span>
          </div>
          
          <h2 className="text-5xl font-black mb-6 leading-none uppercase italic">
            <span className="block text-white mb-2">KHỞI ĐẦU</span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">HUYỀN THOẠI</span>
          </h2>
          <p className="text-gray-300 text-lg font-bold leading-relaxed">"Mỗi nhà vô địch đều bắt đầu từ con số 0. Tham gia ngay để chứng minh bản thân."</p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;