import { CreditCard, Wallet, Landmark, ChevronRight } from 'lucide-react';

const PaymentView = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Nạp Vàng</h1>
          <p className="text-gray-400">Chọn phương thức thanh toán để nạp thêm vàng vào tài khoản.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PaymentMethodCard 
          icon={Wallet} 
          title="Ví Điện Tử" 
          description="Momo, ZaloPay, Viettel Money"
          color="text-pink-500"
          gradient="from-pink-500/20 to-rose-500/5"
        />
        <PaymentMethodCard 
          icon={CreditCard} 
          title="Thẻ Cào" 
          description="Viettel, Mobifone, Vinaphone"
          color="text-orange-500"
          gradient="from-orange-500/20 to-yellow-500/5"
        />
        <PaymentMethodCard 
          icon={Landmark} 
          title="Ngân Hàng" 
          description="Chuyển khoản QR code nhanh"
          color="text-blue-500"
          gradient="from-blue-500/20 to-cyan-500/5"
        />
      </div>

      <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 text-center border-dashed">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="text-gray-500" size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-300">Tính năng đang phát triển</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Hệ thống thanh toán tự động đang được tích hợp. Vui lòng liên hệ Admin để nạp vàng thủ công trong thời gian này.
        </p>
      </div>
    </div>
  );
};

const PaymentMethodCard = ({ icon: Icon, title, description, color, gradient }: { 
  icon: any, 
  title: string, 
  description: string, 
  color: string, 
  gradient: string 
}) => (
  <div className="p-6 rounded-2xl bg-neutral-900/80 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all cursor-pointer">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-full blur-[40px] -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100`}></div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${color}`}>
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
        {title}
        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  </div>
);

export default PaymentView;
