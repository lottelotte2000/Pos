import React, { useState, FormEvent, useEffect } from 'react';
import { User, Shield, Store, Loader2, CheckCircle, ServerCog } from 'lucide-react';

const SetupPage: React.FC = () => {
    const [storeName, setStoreName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // ✅ State สำหรับแสดงข้อความสำเร็จ

    // ✅ Effect นี้จะทำงานเมื่อ isSuccess เป็น true
    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(() => {
                // สั่งให้ Electron โหลดแอปใหม่ทั้งหมด
                window.electronAPI.reloadApp();
            }, 2500); // รอ 2.5 วินาที
            return () => clearTimeout(timer); // Cleanup timer
        }
    }, [isSuccess]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!storeName || !username || !password || !confirmPassword) {
            setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
            return;
        }
        if (password.length < 6) {
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
            return;
        }
        if (password !== confirmPassword) {
            setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
            return;
        }

        setIsLoading(true);
        try {
            const result = await window.electronAPI.completeSetup({
                adminUser: { username, password },
                settings: { storeName }
            });

            if (result.success) {
                setIsSuccess(true); // ✅ ตั้งค่าสำเร็จ
            } else {
                throw new Error(result.error || 'การตั้งค่าล้มเหลว กรุณาลองใหม่อีกครั้ง');
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden md:grid md:grid-cols-2">
                {/* Left Side (Branding) */}
                <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 to-primary-700 p-12 text-white">
                    <ServerCog className="h-24 w-24 mb-6" />
                    <h1 className="text-3xl font-bold mb-2">ยินดีต้อนรับ</h1>
                    <p className="text-center text-primary-100">
                        เริ่มต้นการตั้งค่าระบบ Point of Sale ของคุณโดยการสร้างบัญชีผู้ดูแลระบบหลัก
                    </p>
                </div>

                {/* Right Side (Form) */}
                <div className="p-8 md:p-12">
                    {isSuccess ? (
                        // ✅ หน้าจอเมื่อตั้งค่าสำเร็จ
                        <div className="flex flex-col items-center justify-center text-center h-full">
                            <CheckCircle className="h-20 w-20 text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800">ตั้งค่าสำเร็จ!</h2>
                            <p className="text-gray-600 mt-2">
                                ระบบได้สร้างบัญชีผู้ดูแลระบบเรียบร้อยแล้ว
                            </p>
                            <p className="text-gray-500 mt-4 animate-pulse">
                                กำลังนำท่านไปยังหน้าล็อกอิน...
                            </p>
                        </div>
                    ) : (
                        // ✅ ฟอร์มสำหรับกรอกข้อมูล
                        <>
                            <div className="text-center md:text-left mb-8">
                                <h2 className="text-3xl font-bold text-gray-800">ตั้งค่าระบบ</h2>
                                <p className="mt-2 text-gray-500">สร้างบัญชี Super Admin ของคุณ</p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center"><Store className="h-4 w-4 mr-2 text-gray-400" />ชื่อร้านค้า</label>
                                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="input-style" placeholder="เช่น ร้านสะดวกซื้อ" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center"><User className="h-4 w-4 mr-2 text-gray-400" />ชื่อผู้ใช้ (Admin)</label>
                                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="input-style" placeholder="เช่น admin" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center"><Shield className="h-4 w-4 mr-2 text-gray-400" />รหัสผ่าน</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-style" placeholder="อย่างน้อย 6 ตัวอักษร" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center"><Shield className="h-4 w-4 mr-2 text-gray-400" />ยืนยันรหัสผ่าน</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-style" />
                                </div>

                                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                                <div>
                                    <button type="submit" disabled={isLoading} className="w-full btn-primary flex justify-center items-center mt-4">
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'สร้างและเริ่มต้นใช้งาน'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetupPage;