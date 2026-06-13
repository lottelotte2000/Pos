import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Eye, FileText, Download, Filter, SortAsc, SortDesc, Loader2, BarChart2, Ban, AlertTriangle } from 'lucide-react';
import Receipt from '../components/sales/Receipt';
import { Transaction } from '../types';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 10;

const TransactionsPage: React.FC = () => {
  const { transactions, users, voidTransaction } = useData();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [txToVoid, setTxToVoid] = useState<Transaction | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [cashierFilter, setCashierFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(ITEMS_PER_PAGE);
  const [sortColumn, setSortColumn] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ... (Keep existing Filter/Sort Logic identical) ...
  const filteredAndSortedTransactions = useMemo(() => {
    setIsLoading(true);

    let filtered = transactions || [];

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date) <= end);
    }
    if (cashierFilter) {
      filtered = filtered.filter(t => t.cashierName === cashierFilter);
    }
    if (paymentMethodFilter) {
      filtered = filtered.filter(t => t.paymentMethod === paymentMethodFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (sortColumn === 'date') {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortDirection === 'asc' ? (aValue === bValue ? 0 : (aValue ? 1 : -1)) : (aValue === bValue ? 0 : (aValue ? -1 : 1));
      }

      return 0;
    });

    setIsLoading(false);
    return sorted;
  }, [transactions, startDate, endDate, cashierFilter, paymentMethodFilter, sortColumn, sortDirection]);

  const summaryStats = useMemo(() => {
    // นับเฉพาะบิลที่ไม่ถูกยกเลิก
    const active = filteredAndSortedTransactions.filter(t => !t.voided);
    const totalFilteredRevenue = active.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    let totalFilteredCost = 0;

    active.forEach(transaction => {
      if (Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          totalFilteredCost += (item.quantity || 0) * (item.cost || 0);
        });
      }
    });

    const totalFilteredProfit = totalFilteredRevenue - totalFilteredCost;
    const totalFilteredTransactions = active.length;
    const paymentMethodSummary: { [method: string]: { count: number; total: number } } = {};

    active.forEach(t => {
      if (paymentMethodSummary[t.paymentMethod]) {
        paymentMethodSummary[t.paymentMethod].count++;
        paymentMethodSummary[t.paymentMethod].total += (t.totalAmount || 0);
      } else {
        paymentMethodSummary[t.paymentMethod] = { count: 1, total: (t.totalAmount || 0) };
      }
    });

    return {
      totalFilteredRevenue,
      totalFilteredCost,
      totalFilteredProfit,
      totalFilteredTransactions,
      paymentMethodSummary
    };
  }, [filteredAndSortedTransactions]);

  useEffect(() => { setCurrentPage(1); }, [filteredAndSortedTransactions]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const handleSort = (column: keyof Transaction) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExportData = () => {
    if (!filteredAndSortedTransactions || filteredAndSortedTransactions.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const dataForExport = filteredAndSortedTransactions.map(t => {
      let transactionCost = 0;
      if (Array.isArray(t.items)) {
        t.items.forEach(item => {
          transactionCost += (item.quantity || 0) * (item.cost || 0);
        });
      }
      const transactionProfit = (t.totalAmount || 0) - transactionCost;
      return {
        'เลขที่รายการ': t.id,
        'วันที่และเวลา': new Date(t.date).toLocaleString('th-TH'),
        'แคชเชียร์': t.cashierName,
        'วิธีชำระเงิน': t.paymentMethod,
        'จำนวนรายการ': t.items.length,
        'ยอดรวม': (t.totalAmount || 0).toFixed(2),
        'ต้นทุนรายการ': transactionCost.toFixed(2),
        'กำไรรายการ': transactionProfit.toFixed(2),
      };
    });
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ประวัติการขาย');
    const dateString = new Date().toISOString().split('T')[0];
    const filename = `ประวัติการขาย_${dateString}.xlsx`;
    XLSX.writeFile(workbook, filename);
    alert("ดาวน์โหลดข้อมูลประวัติการขายเรียบร้อยแล้ว");
  };

  const viewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const handleConfirmVoid = () => {
    if (!txToVoid) return;
    const ok = voidTransaction(txToVoid.id, currentUser?.username);
    if (!ok) alert('ไม่สามารถยกเลิกบิลนี้ได้ (อาจถูกยกเลิกไปแล้ว)');
    setTxToVoid(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <div className="p-3 bg-primary-500/20 rounded-2xl">
          <FileText className="h-8 w-8 text-primary-400" />
        </div>
        ประวัติการขาย
      </h1>

      {/* Filter and Export Card */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-6 flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary-400" />
          ตัวกรองและส่งออก
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">วันที่เริ่มต้น</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-style pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">วันที่สิ้นสุด</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-style pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">แคชเชียร์</label>
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="input-style w-full appearance-none"
            >
              <option value="">ทั้งหมด</option>
              {users.map(user => (
                <option key={user.id} value={user.username} className="text-slate-800">{user.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">วิธีชำระเงิน</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="input-style w-full appearance-none"
            >
              <option value="">ทั้งหมด</option>
              {Array.from(new Set(transactions.map(t => t.paymentMethod))).map(method => (
                <option key={method} value={method} className="text-slate-800">{method}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/5">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setCashierFilter('');
              setPaymentMethodFilter('');
            }}
            className="btn btn-secondary"
          >
            รีเซ็ตตัวกรอง
          </button>
          <button
            onClick={handleExportData}
            className="btn btn-success"
            disabled={filteredAndSortedTransactions.length === 0}
          >
            <Download className="h-5 w-5 mr-1" /> ส่งออก Excel
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-6 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-emerald-400" />
          สรุปข้อมูล (รายการที่แสดง)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-slate-400 text-sm mb-1">จำนวนรายการขาย</p>
            <h3 className="text-2xl font-bold text-white">{summaryStats.totalFilteredTransactions}</h3>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-slate-400 text-sm mb-1">ยอดขายรวม</p>
            <h3 className="text-2xl font-bold text-primary-400">{summaryStats.totalFilteredRevenue.toFixed(2)} ฿</h3>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-slate-400 text-sm mb-1">ต้นทุนรวม</p>
            <h3 className="text-2xl font-bold text-rose-400">{summaryStats.totalFilteredCost.toFixed(2)} ฿</h3>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-emerald-400/80 text-sm mb-1">กำไรรวม</p>
            <h3 className="text-2xl font-bold text-emerald-400">{summaryStats.totalFilteredProfit.toFixed(2)} ฿</h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="card p-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-16 w-16 text-primary-500 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white">กำลังโหลดข้อมูล...</h3>
          <p className="text-slate-400">โปรดรอสักครู่</p>
        </div>
      ) : (
        filteredAndSortedTransactions.length === 0 ? (
          <div className="card p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">ไม่พบรายการขาย</h3>
            <p className="text-slate-400">
              {startDate || endDate || cashierFilter || paymentMethodFilter ? 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก' : 'ยังไม่มีประวัติการขายในระบบ'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    {[
                      { id: 'id', label: 'เลขที่' },
                      { id: 'date', label: 'วัน-เวลา' },
                      { id: 'cashierName', label: 'แคชเชียร์' },
                      { id: 'paymentMethod', label: 'วิธีชำระ' },
                      { id: 'items', label: 'รายการ', noSort: true },
                      { id: 'totalAmount', label: 'ยอดรวม' },
                    ].map((col) => (
                      <th key={col.id} scope="col" className={`px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${!col.noSort ? 'cursor-pointer hover:text-white transition-colors' : ''}`} onClick={() => !col.noSort && handleSort(col.id as keyof Transaction)}>
                        <div className="flex items-center gap-1">
                          {col.label}
                          {!col.noSort && sortColumn === col.id && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedTransactions.map((transaction) => {
                    const date = new Date(transaction.date);
                    return (
                      <tr key={transaction.id} className={`hover:bg-white/5 transition-colors ${transaction.voided ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          <span className={transaction.voided ? 'line-through' : ''}>#{transaction.id}</span>
                          {transaction.voided && (
                            <span className="ml-2 px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 text-[10px] font-semibold align-middle">ยกเลิกแล้ว</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {date.toLocaleDateString('th-TH')} <span className="text-slate-500 text-xs ml-1">{date.toLocaleTimeString('th-TH')}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{transaction.cashierName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs">
                            {transaction.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{transaction.items.length}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{transaction.totalAmount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="inline-flex items-center gap-2">
                            <button onClick={() => viewReceipt(transaction)} className="btn btn-secondary !px-3 !py-1.5 text-xs inline-flex text-primary-300 hover:text-primary-200">
                              <Eye className="h-4 w-4 mr-1.5" /> ดูใบเสร็จ
                            </button>
                            {isAdmin && !transaction.voided && (
                              <button onClick={() => setTxToVoid(transaction)} className="btn btn-secondary !px-3 !py-1.5 text-xs inline-flex text-red-400 border-red-500/30 hover:bg-red-500/10" title="ยกเลิก/คืนเงินบิลนี้">
                                <Ban className="h-4 w-4 mr-1.5" /> ยกเลิก
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {totalPages > 1 && !isLoading && filteredAndSortedTransactions.length > 0 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-secondary disabled:opacity-50"
          >
            ย้อนกลับ
          </button>
          <span className="text-slate-400 text-sm">
            หน้า <span className="text-white font-bold">{currentPage}</span> จาก {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-secondary disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      )}

      {showReceipt && selectedTransaction && (
        <Receipt
          transaction={selectedTransaction}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {txToVoid && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-scale-in">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white">ยืนยันการยกเลิกบิล</h3>
            <p className="my-3 text-sm text-slate-400 leading-relaxed">
              ยกเลิกบิล <span className="font-semibold text-white">#{txToVoid.id}</span> ยอด <span className="font-semibold text-white">{txToVoid.totalAmount.toFixed(2)} ฿</span>?<br />
              ระบบจะคืนสต็อกสินค้าในบิลนี้ และตัดออกจากยอดขาย/รายงาน
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => setTxToVoid(null)} className="btn btn-secondary flex-1 py-3 justify-center">ยกเลิก</button>
              <button onClick={handleConfirmVoid} className="btn bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/30 flex-1 py-3 justify-center rounded-xl font-semibold">ยืนยันยกเลิกบิล</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;