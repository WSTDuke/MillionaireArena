import React, { useState } from 'react';
import { Swords, Mail, Lock, User, CheckCircle, ArrowRight, ArrowLeft, Shield, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const SignUpPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Chuyển bước
  const handleNext = () => {
    // Validate cơ bản: Nếu có tên và email thì mới cho qua
    if (formData.displayName && formData.email) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  return (
    <div className="min-h-screen w-full flex bg-black text-white font-sans selection:bg-fuchsia-500 selection:text-white">
      
      {/* --- LEFT SIDE: MULTI-STEP FORM --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 bg-black">
        
        <div className="max-w-md w-full mx-auto mt-12">
          
          {/* Header & Progress Indicator */}
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold mb-4">Gia nhập Đấu trường</h1>
            
            {/* Thanh tiến trình (Progress Bar) */}
            <div className="flex items-center gap-3 text-sm font-medium text-gray-400 mb-2">
              <span className={step === 1 ? "text-fuchsia-500" : "text-green-500"}>Bước 1: Định danh</span>
              <ArrowRight size={14} className="text-gray-600"/>
              <span className={step === 2 ? "text-fuchsia-500" : "text-gray-600"}>Bước 2: Bảo mật</span>
            </div>
            
            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-fuchsia-600 to-purple-600 transition-all duration-500 ease-out ${step === 1 ? 'w-1/2' : 'w-full'}`}
              ></div>
            </div>
          </div>

          <form className="space-y-8 relative overflow-hidden min-h-[300px]">
            
            {/* --- STEP 1: NAME & EMAIL --- */}
            <div className={`transition-all duration-500 ease-in-out absolute w-full ${step === 1 ? 'opacity-100 translate-x-0 relative' : 'opacity-0 -translate-x-full absolute pointer-events-none'}`}>
              
              {/* Input: Display Name */}
              <div className="relative z-0 w-full group mb-8 mt-1">
                <input 
                  type="text" name="displayName" id="displayName" required
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " 
                />
                <label htmlFor="displayName" className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                  Tên của bạn
                </label>
                <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
              </div>

              {/* Input: Email */}
              <div className="relative z-0 w-full group">
                <input 
                  type="email" name="email" id="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " 
                />
                <label htmlFor="email" className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                  Địa chỉ Email
                </label>
                <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
              </div>

              {/* Button Next */}
              <button 
                type="button" onClick={handleNext}
                className="mt-12 w-full py-4 px-4 bg-white text-black hover:bg-gray-200 font-bold rounded-lg transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Tiếp tục
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>


            {/* --- STEP 2: PASSWORD & CONFIRM --- */}
            <div className={`transition-all duration-500 ease-in-out absolute w-full ${step === 2 ? 'opacity-100 translate-x-0 relative' : 'opacity-0 translate-x-full absolute pointer-events-none'}`}>
              
              {/* Input: Password */}
              <div className="relative z-0 w-full group mb-8 mt-1">
                <input 
                  type="password" name="password" id="password" required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " 
                />
                <label htmlFor="password" className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                  Mật khẩu
                </label>
                <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              {/* Input: Confirm Password */}
              <div className="relative z-0 w-full group">
                <input 
                  type="password" name="confirmPassword" id="confirmPassword" required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " 
                />
                <label htmlFor="confirmPassword" className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                  Xác nhận mật khẩu
                </label>
                <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors">
                  <Shield className="w-5 h-5" />
                </div>
              </div>

              {/* Action Buttons Step 2 */}
              <div className="mt-12 flex gap-4">
                <button 
                  type="button" onClick={handleBack}
                  className="w-1/3 py-4 px-4 bg-neutral-900 hover:bg-neutral-800 text-gray-300 hover:text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Quay lại
                </button>
                <button 
                  type="button"
                  className="w-2/3 py-4 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Hoàn thành
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

          </form>

          {/* Login Link */}
          <div className=" text-center text-sm text-gray-500">
             Đã là thành viên? <Link to="/login" className="text-fuchsia-500 hover:text-fuchsia-400 font-bold hover:underline">Đăng nhập ngay</Link>
          </div>

        </div>
      </div>

      {/* --- RIGHT SIDE: COVER ANIME STYLE --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900 justify-center items-center text-center p-16">
        
        {/* 1. Anime Style Background */}
        <div className="absolute inset-0 z-0" 
             style={{
               // Một hình ảnh Anime phong cách Fantasy/Huyền ảo
               backgroundImage: `url("https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1887&auto=format&fit=crop")`, 
               backgroundSize: 'cover',
               backgroundPosition: 'center',
             }}
        ></div>

        {/* 2. Dark Overlay & Tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-900/40 to-black/80 z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-black/30 z-10"></div>

        {/* 3. Glowing Orb Effect */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-fuchsia-500/30 rounded-full blur-[120px] z-10 animate-pulse"></div>

        {/* 4. Slogan Content */}
        <div className="relative z-20 backdrop-blur-md bg-black/20 border border-white/10 p-10 rounded-2xl max-w-lg shadow-2xl">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3" />
            <span>New Season Started</span>
          </div>

          <h2 className="text-5xl font-black mb-6 leading-none">
            <span className="block text-white mb-2">KHỞI ĐẦU</span>
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]">
              HUYỀN THOẠI
            </span>
          </h2>

          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            "Mỗi nhà vô địch đều bắt đầu từ con số 0. Tham gia ngay để chứng minh bản thân."
          </p>

          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((item) => (
               <div key={item} className="w-2 h-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: `${item * 0.2}s` }}></div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SignUpPage;