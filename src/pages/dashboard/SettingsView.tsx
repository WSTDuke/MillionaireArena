import React, { useState } from 'react';
import { 
  User, Shield, Bell, Lock, Smartphone, Globe, 
  Volume2, Monitor, Save, CreditCard, Mail, Camera 
} from 'lucide-react';

const SettingsView = () => {
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cài đặt tài khoản</h1>
        <p className="text-gray-400">Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <SettingsTab 
            icon={User} 
            label="Hồ sơ" 
            active={activeSection === 'profile'} 
            onClick={() => setActiveSection('profile')} 
          />
          <SettingsTab 
            icon={Shield} 
            label="Bảo mật & Đăng nhập" 
            active={activeSection === 'security'} 
            onClick={() => setActiveSection('security')} 
          />
          <SettingsTab 
            icon={Bell} 
            label="Thông báo" 
            active={activeSection === 'notifications'} 
            onClick={() => setActiveSection('notifications')} 
          />
          <SettingsTab 
            icon={Monitor} 
            label="Giao diện" 
            active={activeSection === 'appearance'} 
            onClick={() => setActiveSection('appearance')} 
          />
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && <ProfileSettings />}
          {activeSection === 'security' && <SecuritySettings />}
          {/* Add other sections as needed */}
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const SettingsTab = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-fuchsia-600/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(192,38,211,0.1)]' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
    }`}
  >
    <Icon size={18} className={active ? 'text-fuchsia-400' : 'text-gray-500'} />
    {label}
  </button>
);

const ProfileSettings = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Banner & Avatar */}
    <div className="relative h-48 rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 group">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-50"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
      
      <button className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg text-xs font-bold text-white border border-white/10 transition-colors flex items-center gap-2">
        <Camera size={14} /> Thay đổi ảnh bìa
      </button>

      <div className="absolute -bottom-12 left-8 flex items-end">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-black p-1">
            <img 
              src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=100&h=100" 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover" 
            />
          </div>
          <button className="absolute bottom-1 right-1 bg-fuchsia-600 p-1.5 rounded-full text-white hover:bg-fuchsia-500 transition-colors border-2 border-black">
            <Camera size={12} />
          </button>
        </div>
      </div>
    </div>

    <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <InputGroup label="Tên hiển thị" value="ShadowHunter" />
        <InputGroup label="Tên thật" value="Nguyễn Văn A" />
        <InputGroup label="Bio" value="Pro Player | Rank Diamond | Looking for team" multiline />
      </div>
      <div className="space-y-4">
        <InputGroup label="Email" value="shadowhunter@example.com" icon={Mail} disabled />
        <InputGroup label="Số điện thoại" value="+84 987 654 321" icon={Smartphone} />
        <div className="pt-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Quốc gia</label>
          <div className="flex items-center gap-2 p-3 bg-neutral-900 border border-white/10 rounded-xl">
            <Globe size={18} className="text-gray-500" />
            <select className="bg-transparent border-none outline-none w-full text-white text-sm">
              <option>Vietnam</option>
              <option>Singapore</option>
              <option>Japan</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div className="flex justify-end pt-4">
      <button className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
        <Save size={18} /> Lưu thay đổi
      </button>
    </div>
  </div>
);

const SecuritySettings = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Lock className="text-fuchsia-500" size={20} />
        Đổi mật khẩu
      </h3>
      <div className="space-y-4 max-w-md">
        <InputGroup label="Mật khẩu hiện tại" type="password" placeholder="••••••••" />
        <InputGroup label="Mật khẩu mới" type="password" placeholder="••••••••" />
        <InputGroup label="Xác nhận mật khẩu mới" type="password" placeholder="••••••••" />
        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors">
          Cập nhật mật khẩu
        </button>
      </div>
    </div>

    <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Shield className="text-green-500" size={20} />
        Bảo mật 2 lớp (2FA)
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Tăng cường bảo mật cho tài khoản của bạn bằng cách xác thực qua ứng dụng Authenticator.
      </p>
      <button className="px-4 py-2 border border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/10 font-medium rounded-lg transition-colors">
        Kích hoạt 2FA
      </button>
    </div>
  </div>
);

const InputGroup = ({ label, value, placeholder, type = "text", multiline = false, icon: Icon, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <div className={`relative flex items-center bg-neutral-900 border border-white/10 rounded-xl focus-within:border-fuchsia-500/50 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {Icon && (
        <div className="pl-3 text-gray-500">
          <Icon size={18} />
        </div>
      )}
      {multiline ? (
        <textarea 
          defaultValue={value}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className="w-full bg-transparent border-none outline-none text-white text-sm p-3 resize-none placeholder-gray-600"
        />
      ) : (
        <input 
          type={type} 
          defaultValue={value}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-transparent border-none outline-none text-white text-sm p-3 placeholder-gray-600 ${Icon ? 'pl-2' : ''}`}
        />
      )}
    </div>
  </div>
);

export default SettingsView;
