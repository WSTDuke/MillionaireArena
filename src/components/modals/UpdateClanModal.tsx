import React, { useState } from 'react';
import { 
  X, Shield, ChevronRight, Check, Zap
} from 'lucide-react';
import { CLAN_ICONS, CLAN_COLORS } from '../../pages/dashboard/clanConstants';

interface UpdateClanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (clanData: { 
    name: string; 
    tag: string; 
    description: string; 
    icon: string; 
    color: string 
  }) => void;
  initialData: {
    name: string;
    tag: string;
    description: string;
    icon: string;
    color: string;
  };
}

const UpdateClanModal: React.FC<UpdateClanModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    tag: initialData.tag || '',
    description: initialData.description || '',
    icon: initialData.icon || 'Shield',
    color: initialData.color || 'blue',
  });

  const [selectorView, setSelectorView] = useState<'none' | 'icons' | 'colors'>('none');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = () => {
    setErrors({});
    setSelectorView('none');
    setShowConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    const newErrors: Record<string, boolean> = {};
    if (!formData.name.trim()) newErrors.name = true;
    if (!formData.tag.trim()) newErrors.tag = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setShowConfirm(true);
  };

  const handleFinalSubmit = () => {
    onSubmit(formData);
    handleClose();
  };

  const selectedIconObj = CLAN_ICONS.find((i: { id: string }) => i.id === formData.icon) || CLAN_ICONS[0];
  const selectedColorObj = CLAN_COLORS.find((c: { id: string }) => c.id === formData.color) || CLAN_COLORS[0];
  const SelectedIcon = selectedIconObj.icon;

  const isChanged = 
    formData.name !== initialData.name ||
    formData.tag !== initialData.tag ||
    formData.description !== initialData.description ||
    formData.icon !== initialData.icon ||
    formData.color !== initialData.color;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div 
        className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-[600px] animate-in zoom-in-95 duration-300 relative"
        onClick={() => Object.keys(errors).length > 0 && setErrors({})}
      >
        
        {/* Left Side: Emblem Preview & Selector */}
        <div className={`relative w-full md:w-5/12 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 bg-gradient-to-b ${selectedColorObj.classes.replace('from-', 'from-').replace('to-', 'to-')}/10`}>
           <div className="absolute top-6 left-8 flex items-center gap-2 text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">
              <Shield size={12} /> Biểu tượng Clan
           </div>

           <div className="flex-1 flex flex-col items-center justify-center w-full">
              {/* Main Emblem Display */}
              <div 
                className={`group relative w-48 h-48 rounded-[2.5rem] bg-neutral-950 border-4 border-neutral-800 shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-105 cursor-pointer overflow-hidden`}
                onClick={() => setSelectorView(selectorView === 'icons' ? 'none' : 'icons')}
              >
                  <div className={`absolute inset-0 bg-gradient-to-br ${selectedColorObj.classes} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                  <SelectedIcon size={100} className={`relative z-10 transition-all duration-500 group-hover:scale-110`} style={{ color: selectedColorObj.hex }} />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-x-0 bottom-0 py-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest text-center translate-y-full group-hover:translate-y-0 transition-transform">
                      Nhấn để thay đổi
                  </div>
              </div>

              {/* Icon & Color Quick Switch */}
              <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-[280px]">
                  <button 
                    onClick={() => setSelectorView('icons')}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${selectorView === 'icons' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'} transition-all`}
                  >
                     <span className="text-xs font-bold text-gray-300">Biểu tượng</span>
                     <ChevronRight size={14} className="text-gray-500" />
                  </button>
                  <button 
                    onClick={() => setSelectorView('colors')}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${selectorView === 'colors' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'} transition-all`}
                  >
                     <span className="text-xs font-bold text-gray-300">Màu sắc</span>
                     <ChevronRight size={14} className="text-gray-500" />
                  </button>
              </div>
           </div>

           {/* Inner Selector Drawer */}
           {selectorView !== 'none' && (
             <div className="absolute inset-0 bg-neutral-900/95 backdrop-blur-md z-20 p-8 animate-in slide-in-from-left duration-300">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                     {selectorView === 'icons' ? 'Chọn Biểu tượng' : 'Chọn Màu sắc'}
                   </h3>
                   <button onClick={() => setSelectorView('none')} className="text-gray-500 hover:text-white transition-colors">
                      <X size={20} />
                   </button>
                </div>

                <div className="h-full overflow-y-auto pb-20 scrollbar-none">
                  {selectorView === 'icons' ? (
                    <div className="grid grid-cols-4 gap-4 pb-10">
                      {CLAN_ICONS.map((item: { id: string; icon: React.ElementType }) => {
                        const IconComp = item.icon;
                        return (
                          <button 
                            key={item.id}
                            onClick={() => {
                              setFormData({ ...formData, icon: item.id });
                              setSelectorView('none');
                            }}
                            className={`aspect-square rounded-2xl flex items-center justify-center border transition-all ${formData.icon === item.id ? 'border-blue-500 bg-blue-500/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                          >
                            <IconComp size={24} className={formData.icon === item.id ? 'text-blue-400' : 'text-gray-500'} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4 pb-10">
                      {CLAN_COLORS.map((item: { id: string; bg: string }) => (
                        <button 
                          key={item.id}
                          onClick={() => {
                            setFormData({ ...formData, color: item.id });
                            setSelectorView('none');
                          }}
                          className={`aspect-square rounded-2xl flex items-center justify-center border transition-all ${formData.color === item.id ? 'border-white bg-white/10' : 'border-white/5'} relative`}
                        >
                           <div className={`w-8 h-8 rounded-full ${item.bg} shadow-lg`} />
                           {formData.color === item.id && (
                             <div className="absolute top-1 right-1 bg-white rounded-full p-0.5">
                                <Check size={8} className="text-black font-black" />
                             </div>
                           )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
             </div>
           )}
        </div>

        {/* Right Side: Form Content */}
        <div className="flex-1 p-10 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Cài đặt Clan</h2>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-0.5 rounded border border-white/5 bg-white/5">Hợp lệ</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-0.5 rounded border border-white/5 bg-white/5">Cao cấp</span>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all shadow-inner"
              >
                <X size={24} />
              </button>
           </div>

           <form noValidate onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Tên Clan (Hợp lệ)</label>
                   <input 
                      type="text" 
                      placeholder="Mời nhập tên Clan..."
                      className={`w-full bg-neutral-800/80 border ${errors.name ? 'border-red-500' : 'border-white/5'} rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:bg-neutral-800 focus:border-blue-500/30 transition-all font-bold`}
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: false });
                      }}
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Tag (3-4 Ký tự)</label>
                   <input 
                      type="text" 
                      maxLength={4} 
                      placeholder="SGP"
                      className={`w-full bg-neutral-800/80 border ${errors.tag ? 'border-red-500' : 'border-white/5'} rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:bg-neutral-800 focus:border-blue-500/30 transition-all font-black uppercase text-center`}
                      value={formData.tag}
                      onChange={(e) => {
                        setFormData({ ...formData, tag: e.target.value.toUpperCase() });
                        if (errors.tag) setErrors({ ...errors, tag: false });
                      }}
                   />
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2">Mô tả Clan (Ngắn gọn)</label>
                 <textarea 
                    rows={1}
                    placeholder="Mô tả ngắn gọn về đội của bạn..."
                    className="w-full bg-neutral-800/80 border border-white/5 rounded-3xl px-6 py-5 text-white placeholder-gray-600 focus:bg-neutral-800 focus:border-blue-500/30 transition-all resize-none leading-relaxed"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 />
              </div>

              <div className="space-y-8 ">
                <div className="flex items-center justify-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-yellow-500/5 flex items-center justify-center border border-yellow-500/20 shadow-inner">
                      <Zap size={24} className="text-yellow-500" fill="currentColor" />
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Phí thay đổi</div>
                      <div className="text-xl font-black text-white">200 🪙</div>
                   </div>
                </div>

                <div className="bg-neutral-800/40 border border-white/5 rounded-full p-2 flex items-center justify-between shadow-inner">
                   <button 
                     type="button"
                     onClick={handleClose}
                     className="px-10 py-4 font-black text-gray-400 hover:text-white transition-all text-[11px] uppercase tracking-[0.2em] whitespace-nowrap"
                   >
                     Hủy
                   </button>
                    
                    <button 
                      type="submit"
                      disabled={!isChanged}
                      className={`px-12 py-5 rounded-full font-black text-white uppercase tracking-tighter shadow-2xl transition-all active:scale-95 group flex items-center gap-4 bg-gradient-to-r ${selectedColorObj.classes} hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] whitespace-nowrap ${!isChanged ? 'opacity-30 cursor-not-allowed grayscale-[0.5]' : ''}`}
                    >
                       Cập nhật ngay
                       <ChevronRight size={22} className={`${isChanged ? 'group-hover:translate-x-1' : ''} transition-transform`} />
                    </button>
                </div>
              </div>
           </form>
        </div>

        {/* Confirm Modal Overlay */}
        {showConfirm && (
          <div className="absolute inset-0 bg-black/95 z-[2000] flex items-center justify-center p-8 animate-in fade-in duration-300">
             <div className="max-w-md w-full text-center space-y-10">
                <div className="space-y-4">
                   <div className={`w-24 h-24 rounded-[2rem] bg-gradient-to-br ${selectedColorObj.classes} mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)]`}>
                      <SelectedIcon size={48} className="text-white" />
                   </div>
                   <div className="space-y-1">
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Xác nhận Thay đổi?</h3>
                     <p className="text-gray-400 text-sm font-bold px-4">Hành động này sẽ tiêu tốn <span className="text-yellow-500">200 🪙</span>. Bạn có chắc chắn muốn cập nhật thông tin Clan?</p>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <button 
                     onClick={handleFinalSubmit}
                     className={`w-full py-5 rounded-2xl bg-gradient-to-r ${selectedColorObj.classes} text-white font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all`}
                   >
                     Xác nhận (200 🪙)
                   </button>
                   <button 
                     onClick={() => setShowConfirm(false)}
                     className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-gray-400 font-bold uppercase tracking-widest hover:text-white transition-all"
                   >
                     Kiểm tra lại
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateClanModal;
