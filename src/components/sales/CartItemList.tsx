import React, { useState, useEffect, useRef } from 'react';
import { CartItem as CartItemType } from '../types';
import { Trash2, Edit3, PlusSquare, MinusSquare } from 'lucide-react';

interface CartItemListProps {
  items: CartItemType[];
  onRequestRemoveItem: (index: number) => void;
  onQuantityChange: (index: number, change: number) => void;
  onEditRequest: (item: CartItemType, index: number) => void;
}

const CartItemList: React.FC<CartItemListProps> = ({
  items,
  onRequestRemoveItem,
  onQuantityChange,
  onEditRequest,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingIndex]);

  const handleQuantityClick = (index: number, currentQuantity: number) => {
    setEditingIndex(index);
    setEditingQuantity(currentQuantity.toString());
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingQuantity(e.target.value);
  };

  const applyQuantityChange = (index: number) => {
    if (editingIndex === null) return;
    const currentItem = items[index];
    if (!currentItem) {
      setEditingIndex(null);
      return;
    }
    const newQuantityNum = parseInt(editingQuantity, 10);
    if (isNaN(newQuantityNum) || newQuantityNum < 0) {
      setEditingIndex(null);
      return;
    }
    if (newQuantityNum !== currentItem.quantity) {
      const change = newQuantityNum - currentItem.quantity;
      onQuantityChange(index, change);
    }
    setEditingIndex(null);
  };

  const handleInputBlur = (index: number) => {
    applyQuantityChange(index);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyQuantityChange(index);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingIndex(null);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
      {items.map((item, index) => (
        <div key={item.id + '-' + index} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
          {/* Item info */}
          <div className="flex-grow min-w-0">
            <p className="text-slate-200 text-sm font-medium truncate">{item.name}</p>
            {item.barcode && <p className="text-slate-600 text-xs mt-0.5">{item.barcode}</p>}
            <p className="text-slate-500 text-xs mt-0.5">฿{item.price.toFixed(2)} / ชิ้น</p>
          </div>

          {/* Quantity controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => onQuantityChange(index, -1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <MinusSquare size={16} />
            </button>
            {editingIndex === index ? (
              <input ref={inputRef} type="number" value={editingQuantity}
                onChange={handleQuantityInputChange}
                onBlur={() => handleInputBlur(index)}
                onKeyDown={(e) => handleInputKeyDown(e, index)}
                className="w-10 text-center rounded-lg py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={{ backgroundColor: 'var(--color-bg-surface2)', border: '1px solid var(--color-border)' }}
              />
            ) : (
              <span onClick={() => handleQuantityClick(index, item.quantity)}
                className="w-10 text-center py-1 cursor-pointer text-sm font-semibold text-slate-200 hover:bg-white/5 rounded-lg">
                {item.quantity}
              </span>
            )}
            <button onClick={() => onQuantityChange(index, 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
              <PlusSquare size={16} />
            </button>
          </div>

          {/* Total + Remove */}
          <div className="text-right flex-shrink-0 min-w-[70px]">
            <p className="text-primary-400 font-bold text-sm">฿{(item.price * item.quantity).toFixed(2)}</p>
            <button onClick={() => onRequestRemoveItem(index)}
              className="text-slate-700 hover:text-red-400 transition-colors mt-0.5">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartItemList;