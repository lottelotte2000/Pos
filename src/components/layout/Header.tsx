import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, Package, ArrowRightLeft, BarChart, Users, Store, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Header: React.FC = () => {
  const { currentUser } = useAuth();
  const { mode, toggleMode } = useTheme();
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      // Use Buddhist era year by adding 543 if locale is th-TH, but toLocaleDateString might handle it.
      // We will manually format it to match the image format.
      const thMonth = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const dateString = `วันที่ ${now.getDate()} ${thMonth[now.getMonth()]} ${now.getFullYear() + 543}`;
      setCurrentDate(dateString);
    };
    updateDate();
    const timer = setInterval(updateDate, 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/': return { title: 'แดชบอร์ด', icon: <LayoutDashboard size={20} /> };
      case '/sales': return { title: 'หน้าขาย POS', icon: <ShoppingCart size={20} /> };
      case '/products': return { title: 'จัดการสินค้า', icon: <Package size={20} /> };
      case '/transactions': return { title: 'ประวัติการขาย', icon: <ArrowRightLeft size={20} /> };
      case '/reports': return { title: 'รายงาน', icon: <BarChart size={20} /> };
      case '/users': return { title: 'จัดการผู้ใช้', icon: <Users size={20} /> };
      case '/settings': return { title: 'ตั้งค่าระบบ', icon: <Store size={20} /> };
      default: return { title: 'POS System', icon: <Store size={20} /> };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 z-20 transition-all duration-300"
      style={{ backgroundColor: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="h-full px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-slate-400">{pageInfo.icon}</div>
          <h1 className="text-lg font-semibold text-slate-100">{pageInfo.title}</h1>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {currentUser && (
            <>
              <span className="text-slate-500">{currentDate}</span>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-slate-300 font-medium">
                {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
              </span>
            </>
          )}
          {/* ปุ่มสลับโหมดมืด/สว่าง */}
          <button
            onClick={toggleMode}
            title={mode === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;