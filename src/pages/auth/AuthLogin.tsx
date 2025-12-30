import React, { useState } from 'react';
import { Swords, Mail, Lock, Eye, EyeOff, ArrowRight, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-black text-white font-sans selection:bg-fuchsia-500 selection:text-white">
      
      {/* --- LEFT SIDE: LOGIN FORM (GIỮ NGUYÊN - TÔNG ĐEN/HỒNG TÍM) --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 bg-black">

        <div className="max-w-md w-full mx-auto mt-10">
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold mb-3">Chào mừng, Chiến binh!</h1>
            <p className="text-gray-400">Đăng nhập để tiếp tục chinh phục vinh quang.</p>
          </div>

          <form className="space-y-8">
            
            {/* Input 1: Email (Material Underline style - Giữ nguyên) */}
            <div className="relative z-0 w-full group">
              <input type="email" name="email" id="email" required
                className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " />
              <label htmlFor="email" className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Địa chỉ Email
              </label>
              <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            {/* Input 2: Password (Material Underline style - Giữ nguyên) */}
            <div className="relative z-0 w-full group">
              <input type={showPassword ? "text" : "password"} name="password" id="password" required
                className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " />
              <label htmlFor="password" className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
                Mật khẩu
              </label>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 bottom-3 text-gray-500 hover:text-white transition-colors focus:outline-none">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>


            {/* Action Buttons & Links (Tông Đen/Hồng Tím - Giữ nguyên) */}
            <div className="flex justify-end">
              <a href="#" className="text-sm font-medium text-fuchsia-400 hover:text-fuchsia-300 transition-colors">Quên mật khẩu?</a>
            </div>
            <button type="button" className="w-full py-4 px-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:shadow-[0_0_30px_rgba(192,38,211,0.6)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
              Vào đấu trường ngay
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="mt-10 text-center text-sm text-gray-500">
             Chưa là thành viên? <Link to="/signup" className="text-fuchsia-500 hover:text-fuchsia-400 font-bold hover:underline">Đăng ký ngay</Link>
          </div>
          </form>

        
        </div>
      </div>

      {/* --- RIGHT SIDE: CARTOON/ANIME COVER & SLOGAN (ĐÃ THAY ĐỔI) --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-900 justify-center items-center text-center p-16">
        
        {/* 1. Background Image Hoạt hình Anime (Stylized Art) */}
        {/* Sử dụng ảnh đấu trường phong cách digital/animeconcept */}
        <div className="absolute inset-0 z-0" 
             style={{
               backgroundImage: `url("https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=1976&auto=format&fit=crop")`, 
               backgroundSize: 'cover',
               backgroundPosition: 'center',
             }}
        ></div>

        {/* 2. Overlays (Lớp phủ màu để hòa hợp với web màu đen) */}
        {/* Lớp này làm cho bức ảnh anime tối hơn và ám màu tím/hồng, 
            giúp form bên trái (nền đen) trông liền mạch hơn */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/30 to-transparent z-20 mix-blend-overlay"></div>
        
        {/* 3. Nguồn sáng trung tâm (Spotlight) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-500/20 rounded-full blur-[100px] z-20 pointer-events-none"></div>

        {/* 4. Box Slogan Kính mờ */}
        <div className="relative z-30 max-w-xl backdrop-blur-sm bg-black/30 border border-white/10 p-12 rounded-3xl animate-fade-in-up shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
          
          {/* Slogan chính với hiệu ứng "Million" */}
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 leading-none drop-shadow-2xl">
            <span className="block text-white/90 italic">Chạm vào ước mơ</span>
            {/* Gradient Vàng Gold -> Tím Hồng rực rỡ */}
            <span className="block bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
              TIẾP TỤC  <br /> THÔI!
            </span>
          </h2>

          {/* Slogan phụ thúc giục */}
          <p className="text-xl text-gray-200 font-medium leading-relaxed max-w-md mx-auto">
            Chỉ một bước nữa để gia nhập đấu trường khắc nghiệt nhất và giành lấy phần thưởng triệu đô.
          </p>
          
        </div>
      </div>

    </div>
  );
};

export default LoginPage;