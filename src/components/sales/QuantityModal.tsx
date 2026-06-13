import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Package } from 'lucide-react';

interface QuantityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (quantity: number) => void;
    initialQuantity: number;
    itemName: string;
}

const QuantityModal: React.FC<QuantityModalProps> = ({ isOpen, onClose, onConfirm, initialQuantity, itemName }) => {
    const [quantity, setQuantity] = useState<string>(initialQuantity.toString());
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuantity(initialQuantity.toString());
            // Delay focus slightly to ensure render
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, initialQuantity]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numQty = parseInt(quantity);
        if (!isNaN(numQty) && numQty > 0) {
            onConfirm(numQty);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <Package size={20} className="text-primary-400" />
                        </div>
                        แก้ไขจำนวนสินค้า
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-slate-400 text-sm mb-2">ชื่อสินค้า:</p>
                    <p className="text-white font-medium text-lg truncate">{itemName}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-slate-300 text-sm font-medium mb-2">จำนวนใหม่</label>
                        <input
                            ref={inputRef}
                            type="number"
                            min="1"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-center text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors"
                        >
                            ยกเลิก (Esc)
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 transition-colors shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
                        >
                            <Check size={20} />
                            ยืนยัน (Enter)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuantityModal;
