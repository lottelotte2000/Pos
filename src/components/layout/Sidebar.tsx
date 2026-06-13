import React from 'react';
import { NavLink } from 'react-router-dom';
import { Store, LayoutDashboard, ShoppingCart, Package, ArrowRightLeft, BarChart, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const Sidebar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const { receiptSettings } = useSettings();
  const storeName = receiptSettings?.storeName || 'POS System';
  const [appVersion, setAppVersion] = React.useState('1.0.0');

  React.useEffect(() => {
    const fetchVersion = async () => {
      if (window.electronAPI) {
        try {
          const ver = await window.electronAPI.getAppVersion();
          setAppVersion(ver);
        } catch (error) {
          console.error("Failed to get app version", error);
        }
      }
    };
    fetchVersion();
  }, []);

  const navItem = (to: string, icon: React.ReactNode, label: string, end?: boolean) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary-500/10 text-primary-600 border border-primary-500/20'
            : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside
      className="fixed top-0 left-0 h-screen z-30 w-64 flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-sidebar)', borderRight: '1px solid var(--color-border)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="p-1.5 rounded-lg bg-primary-500/15 mr-3">
          <Store className="h-5 w-5 text-primary-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{storeName}</h3>
          <p className="text-[10px] text-slate-600">ระบบขายหน้าร้าน v{appVersion}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-grow py-4 overflow-y-auto flex flex-col gap-0.5 px-3">
        <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">ขาย</p>
        {navItem('/sales', <ShoppingCart size={17} />, 'หน้าขาย POS')}

        <p className="px-3 mt-4 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">สินค้า</p>
        {navItem('/products', <Package size={17} />, 'รายการสินค้า')}

        <p className="px-3 mt-4 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">รายงาน</p>
        {navItem('/', <LayoutDashboard size={17} />, 'ยอดขายวันนี้', true)}
        {navItem('/transactions', <ArrowRightLeft size={17} />, 'ประวัติการขาย')}
        {navItem('/reports', <BarChart size={17} />, 'รายงานสรุป')}

        {isAdmin && <p className="px-3 mt-4 mb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">ระบบ</p>}
        {isAdmin && navItem('/settings', <Store size={17} />, 'ตั้งค่าระบบ')}
        {isAdmin && navItem('/users', <Users size={17} />, 'จัดการผู้ใช้')}
      </div>

      {/* User Footer */}
      <div className="p-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {currentUser?.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.username}</p>
          <p className="text-[10px] text-slate-600">{currentUser?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}</p>
        </div>
        <button onClick={logout} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0" title="ออกจากระบบ">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;