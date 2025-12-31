import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../../lib/supabase'; // Đảm bảo đường dẫn đúng
import { 
  User, Shield, Bell, Lock, Smartphone, Globe, 
  Volume2, Monitor, Save, CreditCard, Mail, Camera, Edit3 
} from 'lucide-react';
import Toast from '../../components/Toast'; // Đảm bảo đường dẫn đúng
import type { ToastType } from '../../components/Toast';
import { ProfileSettingsSkeleton } from '../../components/LoadingSkeletons';

// --- Types ---
interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  description?: string | null; 
  display_name?: string | null;
}

const SettingsView = () => {
  const { setProfile }: any = useOutletContext();
  const [activeSection, setActiveSection] = useState('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);

  useEffect(() => {
    console.log("SettingsView Mounted");
    const fetchUser = async () => {
      // Chỉ lấy User Auth ở đây để xác thực phiên đăng nhập
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };


  return (
    <div className="animate-fade-in-up relative pb-10">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Cài đặt tài khoản</h1>
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
            icon={Monitor} 
            label="Giao diện" 
            active={activeSection === 'appearance'} 
            onClick={() => setActiveSection('appearance')} 
          />
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && <ProfileSettings user={user} showToast={showToast} setSidebarProfile={setProfile} />}
          {activeSection === 'security' && <SecuritySettings user={user} showToast={showToast} />}
          {activeSection === 'appearance' && (
             <div className="text-gray-400 p-4 border border-white/10 rounded-xl">Chức năng đang phát triển...</div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const SettingsTab = ({ icon: Icon, label, active, onClick }: any) => (
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

const ProfileSettings = ({ user, showToast }: { user: any, showToast: any }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // State cho Form
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  // 1. Fetch data từ bảng 'public.profiles'
  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      setLoadingProfile(true);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
            console.warn('Lỗi lấy profile:', error.message);
        }

        if (data) {
          // Nếu có trong bảng profiles -> Dùng dữ liệu này
          setFullName(data.full_name || '');
          setDisplayName(data.display_name || '');
          setAvatarUrl(data.avatar_url);
          setCoverUrl(data.cover_url);
          setDescription(data.description || ''); 
        } else {
          // Fallback: Chưa có row nào trong profiles -> Dùng metadata từ Auth
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

  // Logic upload file lên Supabase Storage
  const handleFileUpload = async (event: any, type: 'avatar' | 'cover') => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Supabase Upload Error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
      } else {
        setCoverUrl(publicUrl);
      }
      
      showToast(`${type === 'avatar' ? 'Ảnh đại diện' : 'Ảnh bìa'} đã được tải lên!`, 'success');
    } catch (error: any) {
      showToast('Lỗi tải ảnh: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };
  
  // 2. Lưu data vào bảng 'public.profiles'
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const updates = {
        id: user.id, // Bắt buộc phải khớp ID user
        full_name: fullName,
        display_name: displayName,
        description: description,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates); // Upsert: Có thì update, chưa có thì insert

      if (error) throw error;

      // Cập nhật state ở sidebar (DashboardPage) ngay lập tức
      if (setSidebarProfile) {
        setSidebarProfile(updates);
      }

      // (Tùy chọn) Sync ngược lại Auth Metadata để các nơi khác dùng getUser() cũng thấy
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      showToast('Cập nhật hồ sơ thành công!', 'success');
      setIsEditing(false);
    } catch (error: any) {
      showToast('Lỗi cập nhật: ' + error.message, 'error');
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      handleSaveProfile();
    } else {
      setIsEditing(true);
    }
  };

  if (loadingProfile) return <ProfileSettingsSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner & Avatar Container */}
      <div className="relative mb-20">
        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={avatarInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleFileUpload(e, 'avatar')} 
        />
        <input 
          type="file" 
          ref={coverInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleFileUpload(e, 'cover')} 
        />

        {/* Banner */}
        <div className="relative h-48 rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 group">
          <img 
            src={coverUrl || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop"} 
            className="w-full h-full object-cover opacity-50"
            alt="Cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
          
          {isEditing && (
            <button 
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg text-xs font-bold text-white border border-white/10 transition-colors flex items-center gap-2 group-hover:scale-105"
            >
              <Camera size={14} /> {uploading ? 'Đang tải...' : 'Thay đổi ảnh bìa'}
            </button>
          )}
        </div>

        {/* Avatar Positioned Separately to Avoid Clipping */}
        <div className="absolute -bottom-12 left-8 flex items-end">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-neutral-900 p-1 ring-4 ring-neutral-950">
              <img 
                src={avatarUrl || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=100&h=100"} 
                alt="Avatar" 
                className="w-full h-full rounded-full object-cover" 
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            {isEditing && (
              <button 
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-1 right-1 bg-fuchsia-600 p-2 rounded-full text-white hover:bg-fuchsia-500 transition-colors border-2 border-neutral-950 shadow-lg hover:scale-110"
              >
                <Camera size={14} />
              </button>
            )}
          </div>
          <div className="mb-2 ml-4">
            <h4 className="text-xl font-bold text-white">{displayName || 'User'}</h4>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InputGroup 
            label="Tên hiển thị" 
            value={displayName} 
            onChange={(e: any) => setDisplayName(e.target.value)}
            placeholder="Nickname (VD: Shadow)"
            disabled={!isEditing}
            icon={User}
          />
          <InputGroup 
            label="Họ và tên" 
            value={fullName} 
            onChange={(e: any) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
            disabled={!isEditing}
          />
        </div>
        <div className="space-y-4">
          <InputGroup label="Email" value={user?.email || ''} icon={Mail} disabled={true} />
          
          <InputGroup 
            label="Giới thiệu" 
            value={description} 
            onChange={(e: any) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về bạn..."
            disabled={!isEditing} 
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleToggleEdit}
          className={`px-6 py-3 font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2 ${
            isEditing 
              ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-500/20' 
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {isEditing ? (
            <>
              <Save size={18} /> Lưu thay đổi
            </>
          ) : (
             <>
              <Edit3 size={18} /> Chỉnh sửa
            </>
          )}
        </button>
      </div>
    </div>
  );
};

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
       showToast('Vui lòng điền đầy đủ thông tin.', 'error');
       return;
    }
    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp!', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify Current Password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Mật khẩu hiện tại không đúng.');

      // 2. Update Password
      const { error: updateError } = await supabase.auth.updateUser({ password: password });
      
      if (updateError) throw updateError;
      
      showToast('Đổi mật khẩu thành công!', 'success');
      resetForm();
      
    } catch (error: any) {
      showToast(error.message || 'Lỗi đổi mật khẩu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <Lock className="text-fuchsia-500" size={20} />
          Đổi mật khẩu
        </h3>
        
        {!showChangePassword ? (
          <div>
            <p className="text-gray-400 text-sm mb-4">
              Nên sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.
            </p>
            <button 
              onClick={() => setShowChangePassword(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/5"
            >
              Thay đổi mật khẩu
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-w-md animate-fade-in-up">
            <InputGroup 
              label="Mật khẩu hiện tại" 
              type="password" 
              placeholder="••••••••" 
              value={currentPassword}
              onChange={(e: any) => setCurrentPassword(e.target.value)}
            />
            <InputGroup 
              label="Mật khẩu mới" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
            <InputGroup 
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
                className={`px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-fuchsia-500/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
              </button>
              
              <button 
                onClick={resetForm}
                disabled={loading}
                className="px-4 py-2 bg-transparent hover:bg-white/10 text-gray-400 hover:text-white font-medium rounded-lg transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
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
};

const InputGroup = ({ label, value, placeholder, onChange, type = "text", multiline = false, icon: Icon, disabled = false }: any) => (
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
          onChange={onChange}
          rows={3}
          disabled={disabled}
          className="w-full bg-transparent border-none outline-none text-white text-sm p-3 resize-none placeholder-gray-600"
        />
      ) : (
        <input 
          type={type} 
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-transparent border-none outline-none text-white text-sm p-3 placeholder-gray-600 ${Icon ? 'pl-2' : ''}`}
        />
      )}
    </div>
  </div>
);

export default SettingsView;