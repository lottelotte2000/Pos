import React from 'react';
import { Product } from '../../types';
import { Edit, Trash2, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const stockColor = product.stock <= 5 ? 'text-red-500' : product.stock <= 20 ? 'text-amber-500' : 'text-green-500';

  return (
    <div className="flex flex-col rounded-xl overflow-hidden group transition-all hover:border-white/20"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      <div className="p-4 flex-grow">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-28 object-cover rounded-lg mb-3" />
        ) : (
          <div className="w-full h-28 rounded-lg mb-3 flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-bg-surface2)' }}>
            <Package size={36} className="text-slate-700" />
          </div>
        )}
        <h3 className="font-semibold text-slate-200 truncate text-sm">{product.name}</h3>
        {product.barcode && <p className="text-[11px] text-slate-600 font-mono mt-0.5">{product.barcode}</p>}
        <div className="flex justify-between items-center mt-3">
          <p className="text-base font-bold text-primary-400">฿{product.price.toFixed(2)}</p>
          <p className={`text-xs font-semibold ${stockColor}`}>{product.stock} ชิ้น</p>
        </div>
      </div>
      <div className="px-3 py-2 flex justify-end gap-1"
        style={{ borderTop: '1px solid var(--color-border)' }}>
        <button onClick={() => onEdit(product)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
          <Edit size={14} />
        </button>
        <button onClick={() => onDelete(product)}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;