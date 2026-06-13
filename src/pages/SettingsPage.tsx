import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { Save, Store, FileText, Folder, Loader2, Info, Smartphone, Palette, Check, Plus, Trash2, Volume2, Play, Square, CheckCircle2, RefreshCw, Package, Sun, Moon } from 'lucide-react';
import { ReceiptSettings } from '../types';

const SettingsPage: React.FC = () => {
  const { isDataLoaded } = useData();
  const {
    receiptSettings,
    updateReceiptSettings,
    soundSettings,
    updateSoundSettings,
    posSettings,
    updatePosSettings,
  } = useSettings();
  const { theme, setTheme, fontSize, setFontSize, mode, setMode } = useTheme();

  const [editingReceiptSettings, setEditingReceiptSettings] = useState<ReceiptSettings>(receiptSettings);
  const [activeSoundPreview, setActiveSoundPreview] = useState<HTMLAudioElement | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [backupPath, setBackupPath] = useState<string | null>(null);
  const [isBackupPathLoading, setIsBackupPathLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');

  const fetchAppVersion = async () => {
    if (window.electronAPI?.getAppVersion) {
      const version = await window.electronAPI.getAppVersion();
      setAppVersion(version);
    }
  };

  const fetchBackupPath = async () => {
    if (window.electronAPI?.getBackupPath) {
      setIsBackupPathLoading(true);
      const path = await window.electronAPI.getBackupPath();
      setBackupPath(path);
      setIsBackupPathLoading(false);
    }
  };

  useEffect(() => {
    if (isDataLoaded) {
      setEditingReceiptSettings(receiptSettings);
      setIsDirty(false);

      fetchBackupPath();
      fetchAppVersion();
    }
  }, [receiptSettings, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const receiptChanged = JSON.stringify(editingReceiptSettings) !== JSON.stringify(receiptSettings);
    setIsDirty(receiptChanged);
    if (receiptChanged) {
      setSaveMessage(null);
    }
  }, [editingReceiptSettings, receiptSettings, isDataLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditingReceiptSettings(prev => ({ ...prev, [id]: value }));
  };

  const handlePlaySound = (soundFile: string) => {
    if (activeSoundPreview) {
      activeSoundPreview.pause();
      activeSoundPreview.currentTime = 0;
    }

    if (playingSound === soundFile) {
      setPlayingSound(null);
      setActiveSoundPreview(null);
      return;
    }

    const audio = new Audio(`sounds/${soundFile}`);
    audio.volume = 0.5;
    audio.onended = () => {
      setPlayingSound(null);
      setActiveSoundPreview(null);
    };
    audio.play().catch(e => console.error("Error playing sound:", e));
    setActiveSoundPreview(audio);
    setPlayingSound(soundFile);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      updateReceiptSettings(editingReceiptSettings);
      setSaveMessage('✅ บันทึกการตั้งค่าเรียบร้อยแล้ว!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('❌ เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleManualBackup = async () => {
    if (window.electronAPI?.createManualBackup) {
      const result = await window.electronAPI.createManualBackup();
      if (result.success) {
        setSaveMessage('✅ สำรองข้อมูลเรียบร้อยแล้ว');
      } else {
        setSaveMessage('❌ สำรองข้อมูลไม่สำเร็จ: ' + result.message);
      }
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleRestoreBackup = async () => {
    if (!window.confirm('คำเตือน: การกู้คืนข้อมูลจะแทนที่ข้อมูลปัจจุบันทั้งหมด และโปรแกรมจะรีสตาร์ท คุณต้องการดำเนินการต่อหรือไม่?')) {
      return;
    }

    if (window.electronAPI?.restoreBackup) {
      const result = await window.electronAPI.restoreBackup();
      if (result.success) {
        alert('กู้คืนข้อมูลสำเร็จ โปรแกรมจะรีสตาร์ท');
        window.electronAPI.restartApp();
      } else {
        if (result.message !== 'Cancelled') {
          alert('❌ กู้คืนข้อมูลไม่สำเร็จ: ' + result.message);
        }
      }
    }
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI?.selectBackupPath) {
      const selectedPath = await window.electronAPI.selectBackupPath();
      if (selectedPath) {
        setBackupPath(selectedPath);
      }
    }
  };

  if (!isDataLoaded) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary-500/20">
              <Store className="h-8 w-8 text-primary-400" />
            </div>
            ตั้งค่าระบบ
          </h1>
          <p className="text-slate-400 mt-2 ml-1">จัดการการตั้งค่าร้านค้า, การเชื่อมต่อ, และการสำรองข้อมูล</p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={!isDirty || isSaving}
          className="btn-primary !py-3 !px-6 text-lg shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300"
        >
          {isSaving ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
          บันทึกการเปลี่ยนแปลง
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-xl shadow-glass backdrop-blur-md animate-slide-up flex items-center gap-3 ${saveMessage.startsWith('✅') ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-200' : 'bg-red-500/20 border border-red-500/30 text-red-200'}`}>
          {saveMessage.startsWith('✅') ? <div className="p-1 bg-emerald-500/20 rounded-full"><Save size={16} /></div> : <Info size={18} />}
          <span className="font-medium">{saveMessage}</span>
        </div>
      )}

      {/* Backup Settings */}
      <div className="card p-8">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400"><Folder size={20} /></div>
          การสำรองข้อมูล (Backup)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <p className="text-slate-400 leading-relaxed mb-6">
              ระบบจะทำการสำรองข้อมูลอัตโนมัติทุกครั้งที่มีการเปิด-ปิดโปรแกรม เพื่อป้องกันการสูญหายของข้อมูล <br />
              <span className="text-primary-400">แนะนำ:</span> ควรเลือกโฟลเดอร์ที่ซิงค์กับ Cloud (Google Drive, OneDrive)
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleManualBackup}
                className="btn btn-secondary flex items-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Save size={18} /> สำรองข้อมูลทันที
              </button>
              <button
                onClick={handleRestoreBackup}
                className="btn btn-secondary flex items-center gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Loader2 size={18} /> กู้คืนข้อมูล (Restore)
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ตำแหน่งโฟลเดอร์สำรองข้อมูล
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={isBackupPathLoading ? 'กำลังโหลด...' : backupPath || 'ยังไม่ได้ตั้งค่า (ใช้ตำแหน่งเริ่มต้น)'}
                className="input-style flex-1 bg-black/20 text-slate-400"
              />
              <button
                onClick={handleSelectFolder}
                type="button"
                className="btn-secondary whitespace-nowrap"
              >
                เลือกโฟลเดอร์...
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Display Mode */}
      <div className="card p-8 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400"><Sun size={20} /></div>
          โหมดแสดงผล (Display Mode)
        </h2>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          {[
            { id: 'dark', name: 'โหมดมืด', desc: 'ถนอมสายตาในที่แสงน้อย', icon: <Moon size={24} /> },
            { id: 'light', name: 'โหมดสว่าง', desc: 'อ่านง่ายในที่แสงจ้า', icon: <Sun size={24} /> },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as 'dark' | 'light')}
              className={`p-5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${mode === m.id ? 'bg-primary-500/20 border-primary-500 text-primary-300' : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'}`}
            >
              {m.icon}
              <span className="font-semibold">{m.name}</span>
              <span className="text-xs opacity-70">{m.desc}</span>
            </button>
          ))}
        </div>
        <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/20 flex gap-3 items-start">
          <Info className="flex-shrink-0 text-primary-400 mt-0.5" size={18} />
          <p className="text-sm text-primary-200/80 leading-relaxed">
            โหมดแสดงผลแยกจากธีมสีด้านล่าง — ปรับโหมดมืด/สว่างได้อิสระ และจะถูกบันทึกไว้สำหรับการใช้งานครั้งถัดไป
          </p>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="card p-8 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400"><Palette size={20} /></div>
          การปรับแต่ง (Appearance)
        </h2>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">เลือกธีมสี (Color Theme)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'default', name: 'Original', color: 'bg-primary-600' },
              { id: 'midnight', name: 'Midnight', color: 'bg-emerald-600' },
              { id: 'sunset', name: 'Sunset', color: 'bg-rose-600' },
              { id: 'light', name: 'Sky Light', color: 'bg-sky-500 ring-2 ring-white/20' },
              { id: 'christmas', name: 'Christmas', color: 'bg-gradient-to-br from-green-700 to-red-600' },
              { id: 'newyear', name: 'New Year', color: 'bg-gradient-to-br from-slate-900 via-yellow-500 to-yellow-200' },
              { id: 'songkran', name: 'Songkran', color: 'bg-gradient-to-br from-cyan-400 to-pink-400' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as "default" | "midnight" | "sunset" | "light" | "christmas" | "newyear" | "songkran")}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 group ${theme === t.id ? 'border-primary-500 bg-white/5' : 'border-transparent hover:bg-white/5'}`}
              >
                <div className={`w-12 h-12 rounded-full shadow-lg ${t.color} flex items-center justify-center`}>
                  {theme === t.id && <Check className="text-white w-6 h-6 animate-scale-in" />}
                </div>
                <span className={`text-sm font-medium ${theme === t.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {t.name}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <label className="block text-sm font-medium text-slate-300 mb-3">ขนาดตัวอักษร (Font Size)</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'normal', name: 'ปกติ (Normal)', size: 'text-base' },
                { id: 'large', name: 'ใหญ่ (Large)', size: 'text-lg' },
                { id: 'extra', name: 'ใหญ่พิเศษ (Extra)', size: 'text-xl' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontSize(f.id as "normal" | "large" | "extra")}
                  className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 ${fontSize === f.id ? 'bg-primary-500/20 border-primary-500 text-primary-300' : 'bg-black/20 border-white/5 hover:bg-white/10 text-slate-400'}`}
                >
                  <span className={f.size}>A</span>
                  <span className="text-sm">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-primary-500/10 rounded-xl border border-primary-500/20 flex gap-3 items-start">
          <Info className="flex-shrink-0 text-primary-400 mt-0.5" size={18} />
          <p className="text-sm text-primary-200/80 leading-relaxed">
            ธีมสีจะเปลี่ยนบรรยากาศของโปรแกรมโดยทันที และจะถูกบันทึกไว้สำหรับการใช้งานครั้งถัดไป
          </p>
        </div>
      </div>

      {/* Inventory Settings */}
      <div className="card p-8 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400"><Package size={20} /></div>
          การจัดการสต็อก (Inventory)
        </h2>

        <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-white/5">
          <div className="flex-1 pr-4">
            <p className="font-medium text-white">ป้องกันการขายเกินสต็อก</p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              <span className="text-emerald-400">เปิด:</span> ระบบจะไม่ให้เพิ่มสินค้าลงตะกร้าหากสต็อกไม่พอ (กันสต็อกติดลบ)<br />
              <span className="text-slate-500">ปิด (ค่าเริ่มต้น):</span> สามารถขายได้แม้สต็อกจะติดลบ
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={posSettings?.preventNegativeStock ?? false}
            onClick={() => updatePosSettings({ preventNegativeStock: !(posSettings?.preventNegativeStock ?? false) })}
            className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${posSettings?.preventNegativeStock ? 'bg-emerald-500' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${posSettings?.preventNegativeStock ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      <div className="card p-8 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><Volume2 size={20} /></div>
          ตั้งค่าเสียง (Sound Settings)
        </h2>

        <div className="space-y-6">
          {/* Payment Success Sound */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">เสียงเมื่อชำระเงินสำเร็จ (Payment Success)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'success.mp3', name: 'Success', color: 'bg-emerald-500/10 border-emerald-500/30' },
                { id: 'none', name: 'ปิดเสียง (None)', color: 'bg-slate-500/10 border-slate-500/30' }
              ].map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => updateSoundSettings({ ...soundSettings, paymentSuccessSound: sound.id === 'none' ? '' : sound.id })}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group cursor-pointer ${soundSettings?.paymentSuccessSound === (sound.id === 'none' ? '' : sound.id) ? 'bg-primary-500/10 border-primary-500' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${soundSettings?.paymentSuccessSound === (sound.id === 'none' ? '' : sound.id) ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {soundSettings?.paymentSuccessSound === (sound.id === 'none' ? '' : sound.id) ? <CheckCircle2 size={16} /> : <Volume2 size={16} />}
                    </div>
                    <span className={`font-medium ${soundSettings?.paymentSuccessSound === (sound.id === 'none' ? '' : sound.id) ? 'text-white' : 'text-slate-400'}`}>{sound.name}</span>
                  </div>

                  {sound.id !== 'none' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySound(sound.id);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="ทดลองฟัง"
                    >
                      {playingSound === sound.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Sound */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">เสียงข้อผิดพลาด (Error / Alert)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'error.mp3', name: 'Error', color: 'bg-red-500/10 border-red-500/30' },
                { id: 'none', name: 'ปิดเสียง (None)', color: 'bg-slate-500/10 border-slate-500/30' }
              ].map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => updateSoundSettings({ ...soundSettings, errorSound: sound.id === 'none' ? '' : sound.id })}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group cursor-pointer ${soundSettings?.errorSound === (sound.id === 'none' ? '' : sound.id) ? 'bg-primary-500/10 border-primary-500' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${soundSettings?.errorSound === (sound.id === 'none' ? '' : sound.id) ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {soundSettings?.errorSound === (sound.id === 'none' ? '' : sound.id) ? <CheckCircle2 size={16} /> : <Volume2 size={16} />}
                    </div>
                    <span className={`font-medium ${soundSettings?.errorSound === (sound.id === 'none' ? '' : sound.id) ? 'text-white' : 'text-slate-400'}`}>{sound.name}</span>
                  </div>

                  {sound.id !== 'none' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySound(sound.id);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="ทดลองฟัง"
                    >
                      {playingSound === sound.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Empty Barcode Sound */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">เสียงบาร์โค้ดว่างเปล่า (Empty Barcode)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'empty_barcode.mp3', name: 'Beep', color: 'bg-blue-500/10 border-blue-500/30' },
                { id: 'none', name: 'ปิดเสียง (None)', color: 'bg-slate-500/10 border-slate-500/30' }
              ].map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => updateSoundSettings({ ...soundSettings, emptyBarcodeSound: sound.id === 'none' ? '' : sound.id })}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group cursor-pointer ${soundSettings?.emptyBarcodeSound === (sound.id === 'none' ? '' : sound.id) ? 'bg-primary-500/10 border-primary-500' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${soundSettings?.emptyBarcodeSound === (sound.id === 'none' ? '' : sound.id) ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {soundSettings?.emptyBarcodeSound === (sound.id === 'none' ? '' : sound.id) ? <CheckCircle2 size={16} /> : <Volume2 size={16} />}
                    </div>
                    <span className={`font-medium ${soundSettings?.emptyBarcodeSound === (sound.id === 'none' ? '' : sound.id) ? 'text-white' : 'text-slate-400'}`}>{sound.name}</span>
                  </div>

                  {sound.id !== 'none' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySound(sound.id);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="ทดลองฟัง"
                    >
                      {playingSound === sound.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Product Not Found Sound */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">เสียงไม่พบสินค้า (Product Not Found)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'product_not_found.mp3', name: 'Not Found', color: 'bg-amber-500/10 border-amber-500/30' },
                { id: 'none', name: 'ปิดเสียง (None)', color: 'bg-slate-500/10 border-slate-500/30' }
              ].map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => updateSoundSettings({ ...soundSettings, productNotFoundSound: sound.id === 'none' ? '' : sound.id })}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group cursor-pointer ${soundSettings?.productNotFoundSound === (sound.id === 'none' ? '' : sound.id) ? 'bg-primary-500/10 border-primary-500' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${soundSettings?.productNotFoundSound === (sound.id === 'none' ? '' : sound.id) ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      {soundSettings?.productNotFoundSound === (sound.id === 'none' ? '' : sound.id) ? <CheckCircle2 size={16} /> : <Volume2 size={16} />}
                    </div>
                    <span className={`font-medium ${soundSettings?.productNotFoundSound === (sound.id === 'none' ? '' : sound.id) ? 'text-white' : 'text-slate-400'}`}>{sound.name}</span>
                  </div>

                  {sound.id !== 'none' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySound(sound.id);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="ทดลองฟัง"
                    >
                      {playingSound === sound.id ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-8 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><FileText size={20} /></div>
          ตั้งค่าใบเสร็จ
        </h2>

        <div className="space-y-5">
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium text-slate-300 mb-1">ชื่อร้านค้า</label>
            <input id="storeName" type="text" value={editingReceiptSettings.storeName} onChange={(e) => handleInputChange(e)} className="input-style w-full" disabled={isSaving} placeholder="ระบุชื่อร้านค้าของคุณ" />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-1">ที่อยู่ร้าน</label>
            <textarea id="address" value={editingReceiptSettings.address || ''} onChange={(e) => handleInputChange(e)} rows={3} className="input-style w-full min-h-[80px]" disabled={isSaving} placeholder="ที่อยู่..." ></textarea>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">เบอร์โทรศัพท์</label>
            <input id="phone" type="text" value={editingReceiptSettings.phone || ''} onChange={(e) => handleInputChange(e)} className="input-style w-full" disabled={isSaving} placeholder="02-XXX-XXXX" />
          </div>
          <div>
            <label htmlFor="thankYouMessage" className="block text-sm font-medium text-slate-300 mb-1">ข้อความท้ายใบเสร็จ</label>
            <input id="thankYouMessage" type="text" value={editingReceiptSettings.thankYouMessage || ''} onChange={(e) => handleInputChange(e)} className="input-style w-full" disabled={isSaving} placeholder="ขอบคุณที่ใช้บริการ" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-primary-500/10 border border-primary-500/20 mt-2">
          <h3 className="text-md font-semibold text-primary-300 mb-4 flex items-center gap-2">
            <Smartphone size={18} /> ตั้งค่าบัญชี PromptPay
          </h3>

          <div className="space-y-4">
            {(editingReceiptSettings.promptPayAccounts || []).map((account, index) => (
              <div key={account.id || index} className="flex gap-3 items-start animate-fade-in">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="ชื่อบัญชี (เช่น ร้านหลัก)"
                    value={account.name}
                    onChange={(e) => {
                      const newAccounts = [...(editingReceiptSettings.promptPayAccounts || [])];
                      newAccounts[index] = { ...newAccounts[index], name: e.target.value };
                      setEditingReceiptSettings(prev => ({ ...prev, promptPayAccounts: newAccounts }));
                    }}
                    className="input-style w-full text-sm py-2"
                    disabled={isSaving}
                  />
                  <input
                    type="text"
                    placeholder="เบอร์โทร / เลขบัตร / E-Wallet ID"
                    value={account.number}
                    onChange={(e) => {
                      const newAccounts = [...(editingReceiptSettings.promptPayAccounts || [])];
                      newAccounts[index] = { ...newAccounts[index], number: e.target.value };
                      setEditingReceiptSettings(prev => ({ ...prev, promptPayAccounts: newAccounts }));
                    }}
                    className="input-style w-full text-sm py-2 font-mono"
                    disabled={isSaving}
                  />
                </div>
                <button
                  onClick={() => {
                    const newAccounts = [...(editingReceiptSettings.promptPayAccounts || [])];
                    newAccounts.splice(index, 1);
                    setEditingReceiptSettings(prev => ({ ...prev, promptPayAccounts: newAccounts }));
                  }}
                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors mt-1"
                  title="ลบบัญชีนี้"
                  disabled={isSaving}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button
              onClick={() => {
                const newAccount = { id: `pp-${Date.now()}`, name: '', number: '' };
                setEditingReceiptSettings(prev => ({
                  ...prev,
                  promptPayAccounts: [...(prev.promptPayAccounts || []), newAccount]
                }));
              }}
              className="btn btn-secondary w-full border-dashed border-primary-500/30 text-primary-300 hover:border-primary-500/50 hover:text-primary-200 justify-center"
              disabled={isSaving}
            >
              <Plus size={18} className="mr-2" /> เพิ่มบัญชี PromptPay
            </button>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="card p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-slate-700/50 text-slate-400"><Info size={24} /></div>
          <div>
            <h3 className="font-semibold text-white">เกี่ยวกับโปรแกรม</h3>
            <p className="text-sm text-slate-400">POS System Dashboard</p>
          </div>
        </div>
        <div className="bg-black/20 px-4 py-2 rounded-lg border border-white/5">
          <span className="text-slate-400 text-sm mr-2">Version:</span>
          <span className="font-mono text-primary-400">{appVersion || 'Loading...'}</span>
        </div>
        <button
          onClick={() => window.electronAPI?.checkForUpdates()}
          className="ml-4 px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg border border-primary-500/30 transition-all flex items-center gap-2"
        >
          <RefreshCw size={16} /> ตรวจสอบอัปเดต
        </button>
      </div>

    </div>
  );
};

export default SettingsPage;
