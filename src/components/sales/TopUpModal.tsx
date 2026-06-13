import React, { useState } from 'react';
import { X, Smartphone, CheckCircle, Hash } from 'lucide-react';

interface TopUpModalProps {
    onConfirm: (provider: string, phoneNumber: string, amount: number) => void;
    onCancel: () => void;
}

const PROVIDERS = [
    { id: 'AIS', name: 'AIS 1-2-Call', color: 'bg-green-500' },
    { id: 'DTAC', name: 'DTAC Happy', color: 'bg-blue-500' },
    { id: 'TRUE', name: 'TrueMove H', color: 'bg-red-500' },
    { id: 'MY', name: 'My By CAT', color: 'bg-orange-500' },
    { id: 'PENGUIN', name: 'Penguin', color: 'bg-yellow-500' },
];

const AMOUNTS = [20, 50, 100, 200, 300, 500, 1000];

const TopUpModal: React.FC<TopUpModalProps> = ({ onConfirm, onCancel }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState('');

    const handleConfirm = () => {
        if (selectedProvider && phoneNumber.length === 10 && (selectedAmount || customAmount)) {
            const amount = selectedAmount || parseFloat(customAmount);
            onConfirm(selectedProvider, phoneNumber, amount);
        }
    };

    const isValid = selectedProvider && phoneNumber.length === 10 && (selectedAmount || (customAmount && parseFloat(customAmount) > 0));

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
                        <label className="block text-sm font-medium text-slate-400 mb-3">2. กรอกเบอร์โทรศัพท์ (10 หลัก)</label>
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
                        <label className="block text-sm font-medium text-slate-400 mb-3">3. เลือกจำนวนเงิน</label>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {AMOUNTS.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => {
                                        setSelectedAmount(amount);
                                        setCustomAmount('');
                                    }}
                                    className={`py-2 rounded-lg border text-sm font-semibold transition-all duration-200 ${selectedAmount === amount
                                        ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                                        : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    {amount}
                                </button>
                            ))}
                        </div>
                        <input
                            type="number"
                            placeholder="ระบุจำนวนเงินเอง"
                            value={customAmount}
                            onChange={(e) => {
                                setCustomAmount(e.target.value);
                                setSelectedAmount(null);
                            }}
                            className={`w-full bg-black/20 border rounded-xl py-3 px-4 text-center text-lg text-white placeholder-slate-600 focus:outline-none transition-colors ${customAmount ? 'border-primary-500' : 'border-white/10'
                                }`}
                        />
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
                        disabled={!isValid}
                        className={`flex-1 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 ${isValid
                            ? 'bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:shadow-primary-500/30 hover:scale-[1.02]'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        ยืนยันการเติมเงิน
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopUpModal;
