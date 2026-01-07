import { useState } from 'react';
import { Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) throw loginError;

      if (data.session) {
        navigate('/dashboard'); // Chuyển hướng về trang chủ/dashboard sau khi login
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-black text-white font-sans selection:bg-fuchsia-500 selection:text-white">
      
      {/* --- LEFT SIDE: LOGIN FORM (TECH-PREMIUM STYLE) --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10 bg-black">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
        
        {/* Scanline Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/50 to-transparent animate-scanline-fast"></div>
        </div>

        <div className="max-w-md w-full mx-auto mt-10 relative">
          {/* HUD Corner Accents */}
          <div className="absolute -top-4 -left-4 w-16 h-16 border-t-2 border-l-2 border-fuchsia-500/30 pointer-events-none"></div>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 border-b-2 border-r-2 border-fuchsia-500/30 pointer-events-none"></div>
          
          <div className="mb-12 relative">
            {/* Tech Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-4">
              <span className="w-1 h-3 bg-fuchsia-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">// Authentication Portal</span>
            </div>
            
            <h1 className="text-5xl font-black mb-3 uppercase italic tracking-tighter">
              Chào mừng, <span className="text-fuchsia-500">Chiến binh!</span>
            </h1>
            <div className="h-0.5 w-32 bg-gradient-to-r from-fuchsia-600 to-transparent mb-4"></div>
            <p className="text-gray-500 font-bold text-sm">Đăng nhập để tiếp tục chinh phục vinh quang trong Arena.</p>
          </div>

          <form className="space-y-8 relative" onSubmit={handleLogin}>
            
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-200 text-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-2 bg-red-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-red-500"></div>
                {error}
              </div>
            )}

            {/* Input 1: Email (Material Underline style) */}
            <div className="relative z-0 w-full group">
              <input 
                type="email" name="email" id="email" required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " 
              />
              <label htmlFor="email" className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 font-bold uppercase tracking-wider text-xs">
                Địa chỉ Email
              </label>
              <div className="absolute right-0 bottom-3 text-gray-500 peer-focus:text-fuchsia-500 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            {/* Input 2: Password (Material Underline style) */}
            <div className="relative z-0 w-full group">
              <input 
                type={showPassword ? "text" : "password"} name="password" id="password" required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="block py-3 px-0 w-full text-lg text-white bg-transparent border-0 border-b-2 border-gray-700 appearance-none focus:outline-none focus:ring-0 focus:border-fuchsia-500 peer placeholder-transparent" placeholder=" " 
              />
              <label htmlFor="password" className="peer-focus:font-medium absolute text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-fuchsia-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 font-bold uppercase tracking-wider text-xs">
                Mật khẩu
              </label>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 bottom-3 text-gray-500 hover:text-fuchsia-500 transition-colors focus:outline-none">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>


            {/* Action Buttons & Links */}
            <div className="flex justify-end">
              <a href="#" className="text-sm font-black text-fuchsia-400 hover:text-fuchsia-300 transition-colors uppercase tracking-wider">Quên mật khẩu?</a>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 px-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(192,38,211,0.4)] hover:shadow-[0_0_40px_rgba(192,38,211,0.6)] transition-all hover:translate-y-[-2px] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              {loading ? 'Đang xác thực...' : 'Vào đấu trường ngay'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
            <div className="mt-10 text-center text-sm text-gray-600">
             Chưa là thành viên? <Link to="/signup" className="text-fuchsia-500 hover:text-fuchsia-400 font-black hover:underline uppercase tracking-wider">Đăng ký ngay</Link>
          </div>
          </form>

        
        </div>
      </div>

      {/* --- RIGHT SIDE: TECH-PREMIUM COVER --- */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-950 justify-center items-center text-center p-16">
        
        {/* Background Image */}
        <div className="absolute inset-0 z-0" 
             style={{
               backgroundImage: `url("https://images.unsplash.com/photo-1600132806370-bf17e65e942f?q=80&w=1976&auto=format&fit=crop")`, 
               backgroundSize: 'cover',
               backgroundPosition: 'center',
             }}
        ></div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/30 to-transparent z-20 mix-blend-overlay"></div>
        
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-500/20 rounded-full blur-[100px] z-20 pointer-events-none"></div>

        {/* Content Box */}
        <div className="relative z-30 max-w-xl backdrop-blur-sm bg-black/40 border border-fuchsia-500/20 p-12 animate-fade-in-up shadow-[0_10px_50px_rgba(0,0,0,0.5)] overflow-hidden"
             style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
          
          {/* Inner HUD Corners */}
          <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-fuchsia-500/30"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-fuchsia-500/30"></div>
          
          {/* Tech Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 mb-6">
            <span className="w-1 h-3 bg-fuchsia-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">// System Message</span>
          </div>
          
          {/* Slogan */}
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 leading-none drop-shadow-2xl">
            <span className="block text-white/90 italic uppercase">Chạm vào ước mơ</span>
            <span className="block bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent filter drop-shadow-[0_0_30px_rgba(234,179,8,0.5)] uppercase italic">
              TIẾP TỤC<br />THÔI!
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-300 font-bold leading-relaxed max-w-md mx-auto">
            Chỉ một bước nữa để gia nhập đấu trường khắc nghiệt nhất và giành lấy phần thưởng triệu đô.
          </p>
          
        </div>
      </div>

    </div>
  );
};

export default LoginPage;