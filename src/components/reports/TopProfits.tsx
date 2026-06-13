import React from 'react';
import { useProducts } from '../../context/ProductContext';
import { Transaction } from '../../types';

interface TopProfitsProps {
  transactions: Transaction[];
  limit?: number;
}

const TopProfits: React.FC<TopProfitsProps> = ({ transactions, limit = 5 }) => {
  const { products } = useProducts();

  const getTopProfits = () => {
    // ใช้ Record<string, ...> เพื่อความแน่นอนว่า key เป็น string
    const productMap: Record<string, {
      id: string; // เปลี่ยนเป็น string ให้ตรงกับ type
      name: string;
      quantity: number;
      revenue: number;
      cost: number;
    }> = {};

    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        // ใช้ item.id ซึ่งเป็น string และควรจะ unique
        const productId = item.id;
        if (!productId) return; // ข้าม item ที่ไม่มี product id

        if (!productMap[productId]) {
          productMap[productId] = {
            id: productId,
            name: item.name,
            quantity: 0,
            revenue: 0,
            cost: 0,
          };
        }

        const productDetails = products.find(p => p.id === productId);
        const itemCost = productDetails?.cost ? productDetails.cost * item.quantity : 0;
        const itemSubtotal = typeof item.subtotal === 'number' ? item.subtotal : item.price * item.quantity;

        productMap[productId].quantity += item.quantity;
        productMap[productId].revenue += itemSubtotal;
        productMap[productId].cost += itemCost;
      });
    });

    const productsArray = Object.values(productMap).map(p => ({
      ...p,
      profit: p.revenue - p.cost,
    }));

    return productsArray.sort((a, b) => b.profit - a.profit).slice(0, limit);
  };

  const sortedByProfit = getTopProfits();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">กำไรสินค้าวันนี้</h3>
      {sortedByProfit.length === 0 ? (
        <p className="text-gray-500 text-center py-4">ไม่มีข้อมูลการขายในช่วงเวลานี้</p>
      ) : (
        <div className="space-y-4">
          {sortedByProfit.map((product, index) => (
            // ✅ แก้ไข: ใช้ product.id ซึ่งเป็น string และ unique เป็น key
            <div key={product.id} className="flex justify-between border-b pb-2">
              <div>
                <div className="font-medium">{index + 1}. {product.name}</div>
                <div className="text-sm text-gray-500">{product.quantity} ชิ้น / {product.revenue.toFixed(2)} บาท</div>
              </div>
              <div className="text-right font-semibold text-green-600">
                +{product.profit.toFixed(2)} ฿
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopProfits;
