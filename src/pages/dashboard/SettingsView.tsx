import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  User, Shield, Lock, Monitor, Save, Mail, Camera, Edit3, Upload, X, Check
} from 'lucide-react';
import Toast from '../../components/Toast';
import type { ToastType } from '../../components/Toast';
import { ProfileSettingsSkeleton } from '../../components/LoadingSkeletons';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  description?: string | null; 
  display_name?: string | null;
  cover_url?: string | null;
}

const SettingsView = () => {
  const { setProfile }: any = useOutletContext();
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleShowToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  return (
    <div className="pb-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Tech Header */}
      <div className="relative">
        <div className="absolute -inset-4 bg-fuchsia-500/5 blur-3xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-2 flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-fuchsia-500 to-purple-600"></div>
            THIẾT LẬP HỆ THỐNG
          </h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest ml-7">Quản lý cấu hình tài khoản</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tech Navigation */}
        <div className="lg:col-span-1 space-y-3">
          <SettingsTab 
            icon={User} 
            label="Hồ sơ" 
            active={activeSection === 'profile'} 
            onClick={() => setActiveSection('profile')} 
          />
          <SettingsTab 
            icon={Shield} 
            label="Bảo mật" 
            active={activeSection === 'security'} 
            onClick={() => setActiveSection('security')} 
          />
          <SettingsTab 
            icon={Monitor} 
            label="Giao diện" 
            active={activeSection === 'appearance'} 
            onClick={() => setActiveSection('appearance')} 
          />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && <ProfileSettings user={user} showToast={handleShowToast} setSidebarProfile={setProfile} />}
          {activeSection === 'security' && <SecuritySettings user={user} showToast={handleShowToast} />}
          {activeSection === 'appearance' && (
            <div className="tech-card p-8 text-center">
              <Monitor size={48} className="mx-auto mb-4 text-gray-600" />
              <div className="text-sm font-black uppercase tracking-widest text-gray-500">Đang phát triển...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Tech Tab Component
const SettingsTab = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full group relative overflow-hidden"
    style={{ clipPath: active ? 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)' : 'none' }}
  >
    {/* Active Background */}
    {active && (
      <div className="absolute inset-0 bg-fuchsia-600/10 border-l-2 border-fuchsia-500">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0,rgba(217,70,239,0.2)_50%,transparent_100%)] animate-scanline-fast opacity-30"></div>
      </div>
    )}
    
    {/* Hover State */}
    {!active && (
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors"></div>
    )}

    <div className={`relative flex items-center gap-3 px-4 py-3 transition-all ${
      active ? 'text-fuchsia-400' : 'text-gray-500 group-hover:text-white'
    }`}>
      <Icon size={18} className={active ? 'drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]' : ''} />
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
      
      {active && (
        <div className="absolute top-0 right-0 p-1">
          <div className="w-1.5 h-1.5 border-t border-r border-fuchsia-400 opacity-50"></div>
        </div>
      )}
    </div>
  </button>
);

// Profile Settings Component
const ProfileSettings = ({ user, showToast, setSidebarProfile }: { user: any, showToast: any, setSidebarProfile?: any }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      setLoadingProfile(true);

      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (data) {
          setFullName(data.full_name || '');
          setDisplayName(data.display_name || '');
          setAvatarUrl(data.avatar_url);
          setCoverUrl(data.cover_url);
          setDescription(data.description || '');
        } else {
          setFullName(user.user_metadata?.full_name || '');
          setDisplayName(user.user_metadata?.display_name || '');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProfile(false);
      }
    };

    getProfile();
  }, [user]);

  const handleFileUpload = async (event: any, type: 'avatar' | 'cover') => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
      } else {
        setCoverUrl(publicUrl);
      }
      
      showToast(`${type === 'avatar' ? 'Avatar' : 'Cover'} uploaded!`, 'success');
    } catch (error: any) {
      showToast('Upload error: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const updates = {
        id: user.id,
        full_name: fullName,
        display_name: displayName,
        description: description,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      if (setSidebarProfile) setSidebarProfile(updates);

      await supabase.auth.updateUser({ data: { full_name: fullName } });

      showToast('Profile updated!', 'success');
      setIsEditing(false);
    } catch (error: any) {
      showToast('Update error: ' + error.message, 'error');
    }
  };

  if (loadingProfile) return <ProfileSettingsSkeleton />;

  return (
    <div className="space-y-6">
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />

      {/* Cover & Avatar */}
      <div className="tech-card p-0 overflow-hidden">
        {/* Cover */}
        <div className="relative h-48 group">
          <img 
            src={coverUrl || "https://images.unsplash.com/photo-1550745165-9bc0b252723f?q=80&w=2070"} 
            className="w-full h-full object-cover opacity-40"
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
          
          {isEditing && (
            <button 
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading}
              className="absolute top-4 right-4 tech-button-sm"
            >
              <Camera size={14} /> {uploading ? 'Uploading...' : 'Thay đổi cover'}
            </button>
          )}

          {/* Avatar Overlay */}
          <div className="absolute -bottom-16 left-8 flex items-end gap-4">
            <div className="relative group/avatar">
              <div className="absolute -inset-3 bg-fuchsia-500/20 rounded-full blur-xl group-hover/avatar:bg-fuchsia-500/30 transition-all"></div>
              <div className="relative w-32 h-32 rounded-full p-1 bg-black">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-fuchsia-600 to-purple-600 p-[2px]">
                  <img 
                    src={avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover border-4 border-black" 
                  />
                </div>
                {isEditing && (
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-4 border-black transition-all hover:scale-110"
                  >
                    <Camera size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-black text-white uppercase tracking-tight">{displayName || 'User'}</h4>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{user?.email}</p>
            </div>
          </div>
        </div>
        <div className="h-20"></div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TechInput 
          label="Tên hiển thị" 
          value={displayName} 
          onChange={(e: any) => setDisplayName(e.target.value)}
          placeholder="Tên hiển thị"
          disabled={!isEditing}
          icon={User}
        />
        <TechInput 
          label="Tên đầy đủ" 
          value={fullName} 
          onChange={(e: any) => setFullName(e.target.value)}
          placeholder="Tên đầy đủ"
          disabled={!isEditing}
        />
        <TechInput 
          label="Email" 
          value={user?.email || ''} 
          icon={Mail} 
          disabled={true} 
        />
        <TechInput 
          label="Mô tả" 
          value={description} 
          onChange={(e: any) => setDescription(e.target.value)}
          placeholder="Mô tả"
          disabled={!isEditing} 
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {isEditing && (
          <button 
            onClick={() => setIsEditing(false)}
            className="tech-button-secondary"
          >
            <X size={18} /> Hủy
          </button>
        )}
        <button 
          onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
          className="tech-button-primary"
        >
          {isEditing ? (
            <><Save size={18} /> Lưu thay đổi</>
          ) : (
            <><Edit3 size={18} /> Sửa thông tin</>
          )}
        </button>
      </div>
    </div>
  );
};

// Security Settings Component
const SecuritySettings = ({ user, showToast }: any) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setPassword('');
    setConfirmPassword('');
    setShowChangePassword(false);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !password || !confirmPassword) {
       showToast('Please fill all fields', 'error');
       return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Current password is incorrect');

      const { error: updateError } = await supabase.auth.updateUser({ password: password });
      if (updateError) throw updateError;
      
      showToast('Password updated!', 'success');
      resetForm();
      
    } catch (error: any) {
      showToast(error.message || 'Password update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="tech-card p-8">
        <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3 text-white">
          Thay đổi mật khẩu
        </h3>
        
        {!showChangePassword ? (
          <div>
            <p className="text-gray-500 text-sm mb-4 font-medium">
              Sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.
            </p>
            <button 
              onClick={() => setShowChangePassword(true)}
              className="tech-button-secondary"
            >
              Thay đổi mật khẩu
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-w-md">
            <TechInput 
              label="Mật khẩu hiện tại" 
              type="password" 
              placeholder="••••••••" 
              value={currentPassword}
              onChange={(e: any) => setCurrentPassword(e.target.value)}
            />
            <TechInput 
              label="Mật khẩu mới" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
            <TechInput 
              label="Xác nhận mật khẩu mới" 
              type="password" 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
            />
            
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleUpdatePassword}
                disabled={loading}
                className={`tech-button-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
              </button>
              
              <button 
                onClick={resetForm}
                disabled={loading}
                className="tech-button-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2FA */}
      <div className="tech-card p-8">
        <h3 className="text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3 text-white">
          Xác thực hai yếu tố
        </h3>
        <p className="text-gray-500 text-sm mb-4 font-medium">
          Thêm một lớp bảo mật bổ sung với xác thực hai yếu tố thông qua ứng dụng Authenticator.
        </p>
        <button className="tech-button-secondary border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/10">
          Enable 2FA
        </button>
      </div>
    </div>
  );
};

// Tech Input Component
const TechInput = ({ label, value, placeholder, onChange, type = "text", icon: Icon, disabled = false }: any) => (
  <div>
    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">{label}</label>
    <div className={`relative flex items-center bg-black/40 border border-white/10 overflow-hidden transition-all ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'focus-within:border-fuchsia-500/50 focus-within:shadow-[0_0_20px_rgba(192,38,211,0.1)]'
    }`}>
      {Icon && (
        <div className="pl-3 text-gray-600">
          <Icon size={16} />
        </div>
      )}
      <input 
        type={type} 
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-transparent border-none outline-none text-white text-sm p-3 placeholder-gray-700 ${Icon ? 'pl-2' : ''}`}
      />
    </div>
  </div>
);

export default SettingsView;