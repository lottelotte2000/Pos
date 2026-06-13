import React, { useState, useRef } from 'react';
import { Plus, Users, User, Lock, Edit, Trash2, Download, Upload, Loader2, Search, X, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useData } from '../context/DataContext';
import { User as UserType } from '../types';
import { saveAs } from 'file-saver';

const EXPECTED_USER_FIELDS = {
  'id': 'id',
  'username': 'username',
  'password': 'password',
  'role': 'role',
  'createdAt': 'createdAt'
};

const UsersPage: React.FC = () => {
  const { users, addUser, deleteUser, updateUser, bulkImportUsers } = useData();

  // จำนวน admin ในระบบ ใช้สำหรับซ่อนปุ่มลบ admin คนสุดท้าย (กันล็อกตัวเองออก)
  const adminCount = users.filter(u => u.role === 'admin').length;

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | undefined>(undefined);

  // Unified state for form to avoid confusion and bugs
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'cashier' as 'admin' | 'cashier'
  });

  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditUserClick = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Blank for edit
      role: user.role as 'admin' | 'cashier'
    });
    setShowAddUserForm(true);
  };

  const handleCloseForm = () => {
    setShowAddUserForm(false);
    setEditingUser(undefined);
    setFormData({ username: '', password: '', role: 'cashier' }); // Reset form
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Check duplicate username (exclude self)
        const isDuplicate = users.some(u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== editingUser.id);
        if (isDuplicate) {
          alert('ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น');
          return;
        }

        const dataToUpdate: Partial<UserType> = {
          username: formData.username,
          role: formData.role
        };
        if (formData.password) {
          dataToUpdate.password = formData.password;
        }

        const result = await updateUser(editingUser.id, dataToUpdate);
        if (!result.success) {
          alert(result.message || 'ไม่สามารถบันทึกการเปลี่ยนแปลงได้');
          return;
        }
      } else {
        // Check duplicate username
        const isDuplicate = users.some(u => u.username.toLowerCase() === formData.username.toLowerCase());
        if (isDuplicate) {
          alert('ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น');
          return;
        }
        if (!formData.password) {
          alert('กรุณากรอกรหัสผ่าน');
          return;
        }

        await addUser({
          username: formData.username,
          password: formData.password,
          role: formData.role
        });
      }
      handleCloseForm();
    } catch (error) {
      console.error("User operation failed", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleDeleteUserClick = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้?')) {
      const ok = deleteUser(id);
      if (!ok) {
        alert('ไม่สามารถลบได้: ต้องมีผู้ดูแลระบบ (admin) อย่างน้อย 1 คนในระบบเสมอ');
      }
    }
  };

  const handleBackupUsers = () => {
    if (!users || users.length === 0) return;
    const usersToExport = users.map(({ password, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(usersToExport, null, 2)], { type: 'application/json' });
    saveAs(blob, `user_backup_${new Date().toISOString().split('T')[0]}.json`);
  };

  // --- Import Logic (Kept same logic, just cleaner) ---
  const handleImportButtonClick = () => fileInputRef.current?.click();
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportMessage(null);
    setIsImporting(true);

    if (!file.name.endsWith('.json')) {
      setImportMessage("โปรดเลือกไฟล์ .json เท่านั้น");
      setIsImporting(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        if (!Array.isArray(jsonData)) throw new Error("Format invalid");

        const usersToImport: UserType[] = [];
        let skipped = 0;

        jsonData.forEach((item: any) => {
          // Simple validation
          if (item.username && item.role) {
            usersToImport.push({
              ...item,
              id: item.id ? String(item.id) : undefined, // Let backend handle if undefined
              createdAt: item.createdAt || new Date().toISOString()
            } as UserType);
          } else {
            skipped++;
          }
        });

        if (usersToImport.length > 0 && bulkImportUsers) {
          const result = await bulkImportUsers(usersToImport);
          setImportMessage(`นำเข้าสำเร็จ: เพิ่ม ${result.addedCount}, อัปเดต ${result.updatedCount} (ข้าม ${result.skippedUsernameCount})`);
        } else {
          setImportMessage(`ไม่พบข้อมูลที่ถูกต้อง (ข้าม ${skipped})`);
        }

      } catch (error) {
        setImportMessage("ไฟล์ไม่ถูกต้อง");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Filter users
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role === 'admin' ? 'แอดมิน' : 'แคชเชียร์').includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-emerald-400" size={32} />
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-slate-400 mt-1">บริหารจัดการบัญชีผู้ใช้และกำหนดสิทธิ์การเข้าถึง</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json" style={{ display: 'none' }} />

          <button
            onClick={handleImportButtonClick}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            นำเข้า
          </button>

          <button
            onClick={handleBackupUsers}
            disabled={users.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all hover:shadow-lg hover:shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            ส่งออก
          </button>

          <button
            onClick={() => { setEditingUser(undefined); setFormData({ username: '', password: '', role: 'cashier' }); setShowAddUserForm(true); }}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <Plus size={20} />
            เพิ่มผู้ใช้งาน
          </button>
        </div>
      </div>

      {/* Import Message */}
      {importMessage && (
        <div className={`p-4 rounded-xl border ${importMessage.includes('สำเร็จ') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} animate-slide-up`}>
          {importMessage}
        </div>
      )}

      {/* Main Content Card */}
      <div className="card overflow-hidden border-white/10 bg-slate-900/60 backdrop-blur-xl">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20">
          <div className="flex items-center gap-2 text-slate-300">
            <Users size={18} />
            <span className="font-medium">ผู้ใช้งานทั้งหมด ({users.length})</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้งาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-style w-full pl-10 py-2 !bg-black/20 !border-white/10 focus:!bg-black/40"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">ชื่อผู้ใช้</th>
                <th className="p-4 font-medium">บทบาท</th>
                <th className="p-4 font-medium">วันที่สร้าง</th>
                <th className="p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-primary-500/20 text-primary-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {user.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                      </div>
                      <span className="font-medium text-white group-hover:text-primary-300 transition-colors">{user.username}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.role === 'admin'
                      ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงานขาย'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditUserClick(user)}
                        className="p-2 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/20 transition-all"
                        title="แก้ไข"
                      >
                        <Edit size={16} />
                      </button>
                      {!(user.role === 'admin' && adminCount <= 1) && (
                        <button
                          onClick={() => handleDeleteUserClick(user.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    ไม่พบข้อมูลผู้ใช้งาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showAddUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={handleCloseForm} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">

            {/* Modal Header */}
            <div className={`p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r ${editingUser ? 'from-primary-900/50 to-slate-900' : 'from-primary-900/50 to-slate-900'}`}>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editingUser ? <Edit size={24} className="text-primary-400" /> : <Plus size={24} className="text-primary-400" />}
                {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
              </h2>
              <button onClick={handleCloseForm} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitUser} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">ชื่อผู้ใช้งาน</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input-style w-full pl-10 !bg-black/40 !border-white/10 text-white placeholder-slate-600 focus:!border-primary-500/50"
                    placeholder="ระบุชื่อผู้ใช้งาน"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  รหัสผ่าน {editingUser && <span className="text-xs text-slate-500 font-normal">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    name="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-style w-full pl-10 !bg-black/40 !border-white/10 text-white placeholder-slate-600 focus:!border-primary-500/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">บทบาท</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.role === 'cashier' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                    <input
                      type="radio"
                      name="role"
                      value="cashier"
                      checked={formData.role === 'cashier'}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <User size={24} />
                    <span className="font-medium">พนักงานขาย</span>
                  </label>

                  <label className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.role === 'admin' ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <ShieldAlert size={24} />
                    <span className="font-medium">ผู้ดูแลระบบ</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={handleCloseForm} className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-600 text-white font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all">
                  {editingUser ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันการเพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersPage;
