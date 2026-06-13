import React from 'react';
import { Transaction } from '../../types';
import { DollarSign, CreditCard, ShoppingCart, TrendingUp } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface SalesSummaryProps {
  transactions: Transaction[];
  period: string;
}

const SalesSummary: React.FC<SalesSummaryProps> = ({ transactions, period }) => {
  const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalTransactions = transactions.length;

  const getPaymentMethodData = () => {
    const methods: Record<string, { count: number; total: number }> = {};
    transactions.forEach(t => {
      if (!methods[t.paymentMethod]) {
        methods[t.paymentMethod] = { count: 0, total: 0 };
      }
      methods[t.paymentMethod].count++;
      methods[t.paymentMethod].total += t.totalAmount;
    });
    return Object.entries(methods).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total
    }));
  };

  const paymentMethods = getPaymentMethodData();
  const { products } = useData();

  const totalCost = transactions.reduce((sum, t) => {
    const costPerTransaction = t.items.reduce((itemSum, item) => {
      // ใช้ item.id (string) ในการค้นหา
      const product = products.find(p => p.id === item.id);
      const cost = product?.cost ?? 0;
      return itemSum + (cost * item.quantity);
    }, 0);
    return sum + costPerTransaction;
  }, 0);

  const totalProfit = totalSales - totalCost;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">สรุปยอดขาย ({period})</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-blue-100 rounded-full mr-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-700">ยอดขายรวม</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalSales.toFixed(2)}</p>
          <p className="text-sm text-gray-500">บาท</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-green-100 rounded-full mr-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-700">จำนวนครั้งที่ขาย</h4>
          </div>
          <p className="text-2xl font-bold text-green-600">{totalTransactions}</p>
          <p className="text-sm text-gray-500">รายการ</p>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-yellow-100 rounded-full mr-2">
              <CreditCard className="h-5 w-5 text-yellow-600" />
            </div>
            <h4 className="font-medium text-gray-700">วิธีชำระเงิน</h4>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{paymentMethods.length}</p>
          <p className="text-sm text-gray-500">ประเภท</p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-red-100 rounded-full mr-2">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <h4 className="font-medium text-gray-700">ต้นทุนรวม</h4>
          </div>
          <p className="text-2xl font-bold text-red-600">{totalCost.toFixed(2)}</p>
          <p className="text-sm text-gray-500">บาท</p>
        </div>

        <div className={`p-4 rounded-lg border ${totalProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'}`}>
          <div className="flex items-center mb-2">
            <div className={`p-2 rounded-full mr-2 ${totalProfit >= 0 ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <TrendingUp className={`h-5 w-5 ${totalProfit >= 0 ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <h4 className="font-medium text-gray-700">{totalProfit >= 0 ? 'กำไรรวม' : 'ขาดทุนรวม'}</h4>
          </div>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-yellow-600'}`}>{totalProfit.toFixed(2)}</p>
          <p className="text-sm text-gray-500">บาท</p>
        </div>
      </div>

      {paymentMethods.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">ยอดขายตามวิธีชำระเงิน</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            {paymentMethods.map((method) => (
              // ✅ แก้ไข: ใช้ method.method ซึ่งเป็น string ที่ไม่ซ้ำกันเป็น key แทน index
              <div key={method.method} className="flex justify-between py-2 border-b last:border-0">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{method.method}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{method.total.toFixed(2)} บาท</div>
                  <div className="text-xs text-gray-500">{method.count} รายการ</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSummary;
