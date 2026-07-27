import React, { useState } from 'react';
import { X, Smartphone, CheckCircle, Hash, Pencil, Plus, Trash2, Check } from 'lucide-react';
import { TopUpPreset } from '../../types';

interface TopUpModalProps {
    onConfirm: (provider: string, phoneNumber: string, cost: number, profit: number) => void;
    onCancel: () => void;
    amounts: TopUpPreset[];
    onSaveAmounts: (list: TopUpPreset[]) => void;
}

const PROVIDERS = [
    { id: 'AIS', name: 'AIS 1-2-Call', color: 'bg-green-500' },
    { id: 'DTAC', name: 'DTAC Happy', color: 'bg-blue-500' },
    { id: 'TRUE', name: 'TrueMove H', color: 'bg-red-500' },
    { id: 'MY', name: 'My By CAT', color: 'bg-orange-500' },
    { id: 'PENGUIN', name: 'Penguin', color: 'bg-yellow-500' },
];

const TopUpModal: React.FC<TopUpModalProps> = ({ onConfirm, onCancel, amounts, onSaveAmounts }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState('');

    // โหมดแก้ไขปุ่มลัด (แก้ได้ในหน้านี้เลย) — เก็บเป็น string ระหว่างพิมพ์
    const [editing, setEditing] = useState(false);
    const [editRows, setEditRows] = useState<{ cost: string; profit: string }[]>([]);

    const selected = selectedIndex !== null ? amounts[selectedIndex] : null;
    const cost = selected ? selected.cost : (parseFloat(customAmount) || 0);
    const profit = selected ? selected.profit : 0;
    const total = cost + profit;

    const handleConfirm = () => {
        if (selectedProvider && cost > 0) {
            onConfirm(selectedProvider, phoneNumber, cost, profit);
        }
    };

    // เบอร์โทรไม่บังคับ — ต้องเลือกเครือข่าย + มีจำนวนเงินเท่านั้น
    const isValid = !!selectedProvider && cost > 0;

    const startEditing = () => {
        setEditRows(amounts.map(a => ({ cost: String(a.cost), profit: String(a.profit || 0) })));
        setEditing(true);
    };

    const saveEditing = () => {
        // ตัดแถวที่ต้นทุน <= 0 หรือว่างออก แล้วเรียงจากน้อยไปมากตามต้นทุน
        const parsed: TopUpPreset[] = editRows
            .map(r => ({ cost: parseInt(r.cost, 10), profit: parseInt(r.profit, 10) || 0 }))
            .filter(r => Number.isFinite(r.cost) && r.cost > 0)
            .sort((a, b) => a.cost - b.cost);
        onSaveAmounts(parsed.length ? parsed : [{ cost: 20, profit: 0 }]);
        setSelectedIndex(null);
        setEditing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <Smartphone size={24} className="text-primary-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">เติมเงินมือถือ</h2>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">1. เลือกเครือข่าย</label>
                        <div className="grid grid-cols-3 gap-3">
                            {PROVIDERS.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => setSelectedProvider(provider.id)}
                                    className={`relative p-3 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 group ${selectedProvider === provider.id
                                        ? 'bg-primary-600/20 border-primary-500/50 shadow-lg shadow-primary-500/20'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${provider.color} shadow-lg shadow-${provider.color}/50`}></div>
                                    <span className={`text-sm font-semibold ${selectedProvider === provider.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                        {provider.name}
                                    </span>
                                    {selectedProvider === provider.id && (
                                        <div className="absolute top-2 right-2 text-primary-400">
                                            <CheckCircle size={14} className="bg-slate-900 rounded-full" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Phone Number Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">2. เบอร์โทรศัพท์ <span className="text-slate-500">(ไม่บังคับ)</span></label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setPhoneNumber(val);
                                }}
                                placeholder="08xxxxxxxx"
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xl font-mono text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Amount Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-slate-400">3. เลือกจำนวนเงิน</label>
                            {!editing ? (
                                <button
                                    onClick={startEditing}
                                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-primary-300 transition-colors"
                                >
                                    <Pencil size={13} /> แก้ไขปุ่ม
                                </button>
                            ) : (
                                <button
                                    onClick={saveEditing}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                    <Check size={14} /> เสร็จ
                                </button>
                            )}
                        </div>

                        {!editing ? (
                            <>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {amounts.map((preset, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setSelectedIndex(i);
                                                setCustomAmount('');
                                            }}
                                            title={preset.profit ? `กำไร ${preset.profit} ฿ (รับ ${preset.cost + preset.profit} ฿)` : undefined}
                                            className={`py-2 rounded-lg border text-sm font-semibold transition-all duration-200 ${selectedIndex === i
                                                ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                                                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            {preset.cost}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    placeholder="ระบุจำนวนเงินเอง (ไม่มีกำไร)"
                                    value={customAmount}
                                    onChange={(e) => {
                                        setCustomAmount(e.target.value);
                                        setSelectedIndex(null);
                                    }}
                                    className={`w-full bg-black/20 border rounded-xl py-3 px-4 text-center text-lg text-white placeholder-slate-600 focus:outline-none transition-colors ${customAmount ? 'border-primary-500' : 'border-white/10'
                                        }`}
                                />
                                {/* สรุปยอดที่ต้องเก็บเมื่อเลือกปุ่มที่มีกำไร */}
                                {selected && selected.profit > 0 && (
                                    <div className="mt-3 flex justify-between items-center text-sm rounded-lg bg-black/30 border border-white/10 px-4 py-2.5">
                                        <span className="text-slate-400">ต้นทุน {selected.cost} + กำไร {selected.profit}</span>
                                        <span className="font-bold text-primary-400">รับเงิน {total.toLocaleString()} ฿</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* โหมดแก้ไขปุ่มลัด: ช่องซ้าย = ต้นทุน (โชว์บนปุ่ม), ช่องขวา = กำไร (ไม่โชว์) */
                            <div className="rounded-xl bg-black/20 border border-primary-500/30 p-3">
                                <div className="flex items-center gap-2 px-1 mb-2 text-[11px] font-medium text-slate-500">
                                    <span className="flex-1">ต้นทุน (โชว์บนปุ่ม)</span>
                                    <span className="flex-1">กำไร (ไม่โชว์)</span>
                                    <span className="w-7" />
                                </div>
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {editRows.map((row, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    value={row.cost}
                                                    autoFocus={i === editRows.length - 1}
                                                    onChange={(e) => {
                                                        const next = [...editRows];
                                                        next[i] = { ...next[i], cost: e.target.value };
                                                        setEditRows(next);
                                                    }}
                                                    placeholder="0"
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-center text-sm font-semibold text-white focus:outline-none focus:border-primary-500 transition-colors"
                                                />
                                            </div>
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    value={row.profit}
                                                    onChange={(e) => {
                                                        const next = [...editRows];
                                                        next[i] = { ...next[i], profit: e.target.value };
                                                        setEditRows(next);
                                                    }}
                                                    placeholder="0"
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-center text-sm font-semibold text-emerald-400 focus:outline-none focus:border-primary-500 transition-colors"
                                                />
                                            </div>
                                            <button
                                                onClick={() => setEditRows(editRows.filter((_, idx) => idx !== i))}
                                                className="w-7 flex justify-center p-1 text-slate-500 hover:text-red-400 transition-colors"
                                                title="ลบปุ่มนี้"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setEditRows([...editRows, { cost: '', profit: '' }])}
                                    className="mt-2 w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-white/20 text-slate-400 hover:text-primary-300 hover:border-primary-500/50 transition-colors text-sm"
                                >
                                    <Plus size={14} /> เพิ่มปุ่ม
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid || editing}
                        className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 ${isValid && !editing
                            ? 'bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:shadow-primary-500/30 hover:scale-[1.02]'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {isValid ? `ยืนยัน • รับเงิน ${total.toLocaleString()} ฿` : 'ยืนยันการเติมเงิน'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopUpModal;
