import React from 'react';
import { Transaction } from '../../types';

interface TopProductsProps {
  transactions: Transaction[];
  limit?: number;
}

const TopProducts: React.FC<TopProductsProps> = ({ transactions, limit = 10 }) => {
  const getTopProducts = () => {
    const productMap: Record<string, { // ใช้ string สำหรับ product ID
      id: string;
      name: string;
      quantity: number;
      sales: number;
    }> = {};
    
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const productId = item.id; // ใช้ item.id (ควรเป็น string)
        if (!productMap[productId]) {
          productMap[productId] = {
            id: productId,
            name: item.name,
            quantity: 0,
            sales: 0
          };
        }
        
        productMap[productId].quantity += item.quantity;
        const subtotal = typeof item.subtotal === 'number' ? item.subtotal : item.price * item.quantity;
        productMap[productId].sales += subtotal;
      });
    });
    
    return Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  };
  
  const topProducts = getTopProducts();

  if (topProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">สินค้าขายดี</h3>
        <p className="text-gray-500 text-center py-4">ไม่มีข้อมูลการขายในช่วงเวลานี้</p>
      </div>
    );
  }

  const maxQuantity = Math.max(...topProducts.map(p => p.quantity), 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">สินค้าขายดี</h3>
      
      <div className="space-y-4">
        {topProducts.map((product, index) => (
          // ✅ แก้ไข: ใช้ product.id ที่เป็น string และ unique เป็น key
          <div key={product.id} className="relative">
            <div className="flex justify-between mb-1">
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-2">
                  {index + 1}
                </span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">{product.quantity} ชิ้น</span>
                <span className="text-sm text-gray-500 ml-2">({product.sales.toFixed(2)} บาท)</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(product.quantity / maxQuantity) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
