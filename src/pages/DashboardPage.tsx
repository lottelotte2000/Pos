import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useProducts } from '../context/ProductContext';
import { DollarSign, ShoppingBag, TrendingUp, Package, ArrowRight } from 'lucide-react';
import SalesChart from '../components/reports/SalesChart';
import { format, isToday } from 'date-fns';
import { th } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { transactions = [] } = useData();
  const { products = [] } = useProducts();
  const navigate = useNavigate();

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const todayTransactions = transactions.filter(t => isToday(new Date(t.date)) && !t.voided); // ไม่นับบิลที่ถูกยกเลิก
    const totalSalesToday = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0); // Fixed: t.total -> t.totalAmount
    const totalProfitToday = todayTransactions.reduce((sum, t) => {
      const cost = t.items.reduce((c, item) => c + (item.cost || 0) * item.quantity, 0); // Fixed: item.costPrice -> item.cost
      return sum + (t.totalAmount - cost); // Fixed: t.total -> t.totalAmount
    }, 0);
    const transactionCount = todayTransactions.length;
    const lowStockCount = products.filter(p => p.stock <= 5).length;

    return { totalSalesToday, totalProfitToday, transactionCount, lowStockCount, todayTransactions };
  }, [transactions, products]);

  // --- Sales Chart Data ---
  // Note: SalesChart component expects full transaction array and handles grouping internally
  // But here we want custom chart data? 
  // Wait, the existing SalesChart takes `transactions` prop. 
  // Let's use it correctly or create a local chart if we want custom data.
  // Actually, let's just use the SalesChart as intended by passing today's transactions.
  const chartTransactions = stats.todayTransactions;

  // --- Top Products Data ---
  const topProducts = useMemo(() => {
    const productSales: Record<string, number> = {};
    stats.todayTransactions.forEach(t => {
      t.items.forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
  }, [stats.todayTransactions]);


  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ภาพรวมร้านค้า</h1>
          <p className="text-slate-400 mt-1">
            ข้อมูลประจำวันที่ {format(new Date(), 'dd MMMM yyyy', { locale: th })}
          </p>
        </div>
        <button
          onClick={() => navigate('/sales')}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <ShoppingBag size={20} />
          ไปหน้าขายสินค้า
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-indigo-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">ยอดขายวันนี้</p>
              <h3 className="text-2xl font-bold text-white">{stats.totalSalesToday.toLocaleString()} ฿</h3>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">กำไรวันนี้ (ประมาณ)</p>
              <h3 className="text-2xl font-bold text-white">{stats.totalProfitToday.toLocaleString()} ฿</h3>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">จำนวนบิล</p>
              <h3 className="text-2xl font-bold text-white">{stats.transactionCount} รายการ</h3>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors" onClick={() => navigate('/products')}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">สินค้าใกล้หมด</p>
              <h3 className="text-2xl font-bold text-white">{stats.lowStockCount} รายการ</h3>
            </div>
            <ArrowRight size={16} className="ml-auto text-amber-400 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-400" />
            กราฟยอดขายรายชั่วโมง
          </h3>
          <div className="h-80">
            {/* Passing transactions prop primarily needed for SalesChart */}
            <SalesChart transactions={chartTransactions} />
          </div>
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Package size={20} className="text-emerald-400" />
            สินค้าขายดีวันนี้
          </h3>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                      {index + 1}
                    </div>
                    <div className="font-medium text-slate-200">{product.name}</div>
                  </div>
                  <div className="text-emerald-400 font-bold">{product.quantity} ชิ้น</div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500">
                ยังไม่มีการขายวันนี้
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;