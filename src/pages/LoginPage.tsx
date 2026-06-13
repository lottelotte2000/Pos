import React, { useState, useEffect } from 'react';
import { ShoppingBag, Lock, User, AlertCircle, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext'; // ✅ 1. เปลี่ยนมาใช้ useSettings
import { useNavigate } from 'react-router-dom'; // ✅ 2. Import useNavigate สำหรับการ redirect

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // ✅ 3. เพิ่ม isLoading state

  const { login } = useAuth();
  const { receiptSettings } = useSettings(); // ✅ 4. ดึงข้อมูลจาก useSettings
  const navigate = useNavigate(); // ✅ 5. สร้าง instance ของ navigate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // ✅ 6. เริ่ม loading

    try {
      if (!username || !password) {
        setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
        setIsLoading(false);
        return;
      }

      const success = await login(username, password);
      if (success) {
        navigate('/', { replace: true }); // ✅ 7. Login สำเร็จแล้วส่งไปหน้าหลัก
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false); // ✅ 8. หยุด loading ไม่ว่าจะสำเร็จหรือล้มเหลว
    }
  };

  // Focus ที่ช่อง username ตอนเปิดหน้า
  useEffect(() => {
    document.getElementById('username')?.focus();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background is already handled by index.css (dark radial gradient) */}

      {/* Optional decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="card max-w-md w-full p-8 border-white/10 shadow-2xl animate-slide-up bg-black/40 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center p-4 rounded-2xl bg-gradient-to-tr from-primary-500 to-violet-500 shadow-lg shadow-primary-500/30 mb-6">
            <ShoppingBag className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            {receiptSettings?.storeName || 'POS System'}
          </h1>
          <p className="text-slate-400">เข้าสู่ระบบเพื่อจัดการร้านค้าของคุณ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="username">
                ชื่อผู้ใช้
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  id="username"
                  type="text"
                  className="input-style w-full pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2" htmlFor="password">
                รหัสผ่าน
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  className="input-style w-full pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3.5 text-lg font-semibold shadow-lg shadow-primary-500/20 flex justify-center items-center mt-2 group"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-6 w-6" />
            ) : (
              <LogIn className="h-6 w-6 mr-2 group-hover:translate-x-1 transition-transform" />
            )}
            {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>

      <div className="absolute bottom-4 text-center text-slate-600 text-xs">
        &copy; {new Date().getFullYear()} POS System. All rights reserved.
      </div>
    </div>
  );
};

export default LoginPage;