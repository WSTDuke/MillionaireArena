import { useState } from 'react';
import { CreditCard, Check, Copy, ChevronLeft, Gem, ShieldCheck, X, AlertTriangle } from 'lucide-react';

interface GoldPackage {
  id: string;
  price: number;
  gold: number;
  bonus: number;
  popular?: boolean;
  color: string;
}

const GOLD_PACKAGES: GoldPackage[] = [
  { id: 'p1', price: 20000, gold: 2000, bonus: 0, color: 'text-gray-400' },
  { id: 'p2', price: 50000, gold: 5000, bonus: 500, color: 'text-blue-400' },
  { id: 'p3', price: 100000, gold: 10000, bonus: 2000, popular: true, color: 'text-purple-400' },
  { id: 'p4', price: 200000, gold: 20000, bonus: 5000, color: 'text-yellow-400' },
  { id: 'p5', price: 500000, gold: 50000, bonus: 15000, color: 'text-orange-400' },
  { id: 'p6', price: 1000000, gold: 100000, bonus: 50000, color: 'text-red-500' },
];

const PaymentView = () => {
  const [selectedPackage, setSelectedPackage] = useState<GoldPackage | null>(null);
  const [step, setStep] = useState<'selection' | 'confirm' | 'payment'>('selection');

  const handleSelectPackage = (pkg: GoldPackage) => {
    setSelectedPackage(pkg);
    setStep('confirm');
  };

  const handleConfirm = () => {
    setStep('payment');
  };

  const handleBack = () => {
    if (step === 'payment') {
      // Maybe warn user if they want to cancel pending transaction? For now just go back.
      setStep('selection');
      setSelectedPackage(null);
    } else {
      setStep('selection');
      setSelectedPackage(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="animate-fade-in-up pb-10 max-w-6xl mx-auto relative">
      {/* Header */}
      {step === 'selection' && (
        <div className="mb-12 relative animate-fade-in">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 mb-4 rounded-sm">
              <span className="w-1 h-3 bg-yellow-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Store // Currency</span>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
             Kho Báu <span className="text-yellow-500">Arena</span>
           </h1>
           <div className="h-0.5 w-32 bg-gradient-to-r from-yellow-600 to-transparent mt-2"></div>
           <p className="text-gray-500 mt-4 font-bold max-w-lg text-sm leading-relaxed">
             Giao dịch an toàn qua chuyển khoản ngân hàng. Nhận vàng ngay lập tức sau khi hệ thống xác nhận.
           </p>
        </div>
      )}

      {/* STEP 1: PACKAGE SELECTION */}
      {step === 'selection' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {GOLD_PACKAGES.map((pkg) => (
            <div 
              key={pkg.id}
              onClick={() => handleSelectPackage(pkg)}
              className={`relative group cursor-pointer rounded-3xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-800/50 transition-all duration-300 overflow-hidden hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ${pkg.popular ? 'ring-1 ring-yellow-500/50' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl z-20">
                  Best Value
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="p-8 flex flex-col items-center text-center relative z-10">
                <div className={`w-20 h-20 rounded-full bg-white/5 mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${pkg.color}`}>
                   <Gem size={32} className="drop-shadow-[0_0_10px_currentColor]" />
                </div>
                
                <h3 className="text-3xl font-black text-white italic tracking-tighter mb-1">
                  {formatNumber(pkg.gold + pkg.bonus)} <span className="text-sm font-bold text-yellow-500 not-italic tracking-normal">VÀNG</span>
                </h3>
                
                {pkg.bonus > 0 && (
                   <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-6 bg-green-500/10 px-2 py-1 rounded">
                     Tặng thêm {formatNumber(pkg.bonus)}
                   </div>
                )}
                {!pkg.bonus && <div className="h-6 mb-6"></div>}

                <div className="w-full h-px bg-white/10 mb-6 group-hover:bg-white/20 transition-colors"></div>

                <div className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                  {formatCurrency(pkg.price)}
                </div>
                <div className="text-xs text-gray-500 font-medium mt-2">Chuyển khoản Direct Transfer</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRMATION OVERLAY */}
      {step === 'confirm' && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={handleBack} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-yellow-500">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Xác nhận giao dịch</h3>
                <p className="text-gray-400 text-sm mt-2">Bạn có chắc chắn muốn mua gói này?</p>
              </div>

              <div className="bg-black/50 rounded-xl p-4 mb-6 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Gói nạp</span>
                   <span className="text-white font-bold">{formatNumber(selectedPackage.gold + selectedPackage.bonus)} Vàng</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                   <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Thanh toán</span>
                   <span className="text-yellow-500 font-black">{formatCurrency(selectedPackage.price)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={handleBack} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors">
                    Hủy bỏ
                 </button>
                 <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm transition-colors shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                    Xác nhận
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* STEP 2: QR PAYMENT */}
      {step === 'payment' && selectedPackage && (
        <div className="animate-in slide-in-from-bottom-4 duration-300">
          <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-widest">Quay lại cửa hàng</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
             {/* QR Column */}
             <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center">
                <div className="text-black font-black text-xl uppercase tracking-tighter mb-4 text-center">Quét mã để thanh toán</div>
                <div className="aspect-square w-full max-w-[300px] bg-neutral-100 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center">
                   {/* Placeholder QR - replace with real API in production */}
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=2|99|${selectedPackage.price}|MMA-${selectedPackage.id}`} 
                     alt="Payment QR" 
                     className="w-full h-full object-contain mix-blend-multiply"
                   />
                   <div className="absolute inset-0 border-4 border-yellow-500/0"></div>
                </div>
                <div className="flex items-center gap-2 text-neutral-500 text-xs font-bold uppercase tracking-widest">
                   <ShieldCheck size={14} className="text-green-600" />
                   Tự động xác nhận
                </div>
             </div>

             {/* Info Column */}
             <div className="space-y-6">
                <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8">
                   <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                      <CreditCard className="text-yellow-500" />
                      Thông tin chuyển khoản
                   </h3>

                   <div className="space-y-4">
                      <InfoRow label="Ngân hàng" value="MB Bank (Quân Đội)" copyable={false} />
                      <InfoRow label="Số tài khoản" value="0987654321" copyable={true} />
                      <InfoRow label="Chủ tài khoản" value="NGUYEN VAN ADMIN" copyable={false} />
                      <InfoRow label="Số tiền" value={`${selectedPackage.price} VND`} copyable={true} highlight />
                      <InfoRow label="Nội dung CK" value={`MMA ${selectedPackage.id} USER123`} copyable={true} highlight />
                   </div>
                </div>

                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-xs leading-relaxed">
                   <strong>Lưu ý:</strong> Vui lòng điền chính xác <strong>Nội dung chuyển khoản</strong> để hệ thống tự động cộng vàng vào tài khoản của bạn. Giao dịch sai nội dung có thể mất 24h để xử lý thủ công.
                </div>

                <button 
                  onClick={handleBack}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98]"
                >
                   Đã chuyển khoản thành công
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value, copyable, highlight }: { label: string, value: string, copyable: boolean, highlight?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-white/5 border-yellow-500/50' : 'bg-black/20 border-white/5'} flex justify-between items-center group`}>
       <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</span>
          <span className={`font-bold font-mono ${highlight ? 'text-yellow-400 text-lg' : 'text-white'}`}>{value}</span>
       </div>
       {copyable && (
          <button 
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all relative"
            title="Sao chép"
          >
             {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
             {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[9px] font-bold px-2 py-0.5 rounded shadow-lg animate-fade-in-up">COPIED</span>}
          </button>
       )}
    </div>
  );
};

export default PaymentView;
