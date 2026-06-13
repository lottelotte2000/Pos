import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, ShieldCheck, Info, ChevronDown, ChevronUp } from 'lucide-react';

const UpdateNotification: React.FC = () => {
  const [message, setMessage] = useState('');
  const [percent, setPercent] = useState(0);
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState<string | any[] | null>(null);
  const [newVersion, setNewVersion] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    // Listen for available update with details
    window.electronAPI.onUpdateAvailable((_event: any, info: any) => {
      setNewVersion(info.version);
      setReleaseNotes(info.releaseNotes);
      setMessage(`พบเวอร์ชันใหม่ ${info.version}`);
      setIsVisible(true);
      // Auto expand details if available
      if (info.releaseNotes) setShowDetails(true);
    });

    // Listen for update messages (fallback)
    window.electronAPI.onUpdateMessage((_event: any, text: string) => {
      if (!newVersion) setMessage(text); // Only set if we don't have specific version info yet
      setIsVisible(true);
      if (text.includes('ล่าสุด')) {
        setTimeout(() => setIsVisible(false), 5000);
      }
    });

    // Listen for progress
    window.electronAPI.onUpdateProgress((_event: any, progressObj: { percent: number }) => {
      setPercent(Math.floor(progressObj.percent));
      setIsVisible(true);
    });

    // Listen for completion
    window.electronAPI.onUpdateReady(() => {
      setIsUpdateReady(true);
      setMessage('เวอร์ชันใหม่พร้อมติดตั้ง');
      setIsVisible(true);
    });

  }, []);

  const handleInstall = () => {
    window.electronAPI?.installUpdate();
  };

  const renderReleaseNotes = () => {
    if (!releaseNotes) return null;

    let content;
    if (typeof releaseNotes === 'string') {
      // Strip HTML tags for safety if needed, or just display as is?
      // Usually safe from electron-updater source (github/s3)
      // For simplicity, let's just display text, maybe strip heavy html
      content = <div className="text-xs text-slate-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: releaseNotes }} />;
    } else if (Array.isArray(releaseNotes)) {
      content = (
        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
          {releaseNotes.map((note, i) => (
            <li key={i}>{typeof note === 'string' ? note : note.note}</li>
          ))}
        </ul>
      );
    }

    return (
      <div className="mt-2 p-3 bg-black/20 rounded-lg border border-white/5 max-h-32 overflow-y-auto custom-scrollbar">
        <h4 className="text-xs font-bold text-primary-300 mb-1 flex items-center gap-1">
          <Info size={12} /> สิ่งที่เปลี่ยนแปลง:
        </h4>
        {content}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 w-80 overflow-hidden relative transition-all duration-300">
        {/* Background Gradient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl -z-10"></div>

        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isUpdateReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary-500/20 text-primary-400'}`}>
              {isUpdateReady ? <RefreshCw size={20} className={isUpdateReady ? "animate-spin-slow" : ""} /> : <Download size={20} className="animate-bounce-slow" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{isUpdateReady ? 'พร้อมอัปเดต' : newVersion ? `กำลังอัปเดตเป็น v${newVersion}` : 'กำลังอัปเดตระบบ'}</h3>
              <p className="text-xs text-slate-400">POS System Updater</p>
            </div>
          </div>
          <button onClick={() => setIsVisible(false)} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed font-medium">{message}</p>

          {!isUpdateReady && percent > 0 && percent < 100 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-primary-300">
                <span>Downloading...</span>
                <span>{percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Release Notes Expandable */}
          {releaseNotes && !isUpdateReady && (
            <div className="pt-1">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors uppercase font-bold tracking-wider"
              >
                {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {showDetails ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
              </button>

              {showDetails && renderReleaseNotes()}
            </div>
          )}

          {isUpdateReady && (
            <div className="pt-2 animate-fade-in">
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mb-3 flex gap-2 items-start">
                <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-emerald-200/80">ระบบจะทำการสำรองข้อมูลให้อัตโนมัติก่อนเริ่มการติดตั้ง</p>
              </div>
              <button
                onClick={handleInstall}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-900/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> อัปเดตและรีสตาร์ททันที
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
