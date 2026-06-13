import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useProducts } from '../context/ProductContext';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, Download, FileText, Star, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ✅ ไม่ต้องใช้ jsPDF และฟอนต์อีกต่อไป

// (ส่วน Type definitions ไม่มีการเปลี่ยนแปลง)
type ReportSummary = { totalRevenue: number; totalCost: number; totalProfit: number; transactionCount: number; itemCount: number; averageSale: number; };
type TopProduct = { id: string; name: string; quantitySold: number; totalRevenue: number; };
type DetailedSaleItem = { date: string; name: string; quantity: number; cost: number; price: number; totalProfit: number; };

const ReportsPage: React.FC = () => {
    const { transactions } = useData();
    const { products } = useProducts();

    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: new Date() });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [detailedSaleItems, setDetailedSaleItems] = useState<DetailedSaleItem[]>([]);
    const [chartData, setChartData] = useState<{ labels: string[]; values: number[] }>({ labels: [], values: [] });

    useEffect(() => {
        if (!transactions || !dateRange?.from) return;

        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999);

        // ตัดบิลที่ถูกยกเลิก (voided) ออกจากรายงานทั้งหมด
        const filtered = transactions.filter(t => new Date(t.date) >= fromDate && new Date(t.date) <= toDate && !t.voided);

        // รวมยอดขายรายวันสำหรับกราฟ
        const byDay: Record<string, number> = {};
        filtered.forEach(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            byDay[key] = (byDay[key] || 0) + t.totalAmount;
        });
        const dayKeys = Object.keys(byDay).sort();
        setChartData({
            labels: dayKeys.map(k => { const [, m, dd] = k.split('-'); return `${parseInt(dd)}/${parseInt(m)}`; }),
            values: dayKeys.map(k => byDay[k]),
        });

        const totalRevenue = filtered.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalCost = filtered.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + ((item.cost || 0) * item.quantity), 0), 0);
        const itemCount = filtered.reduce((sum, t) => sum + t.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);

        setSummary({ totalRevenue, totalCost, totalProfit: totalRevenue - totalCost, transactionCount: filtered.length, itemCount, averageSale: filtered.length > 0 ? totalRevenue / filtered.length : 0 });

        const productSales: { [key: string]: { quantitySold: number; totalRevenue: number } } = {};
        filtered.forEach(t => t.items.forEach(item => {
            if (!productSales[item.id]) productSales[item.id] = { quantitySold: 0, totalRevenue: 0 };
            productSales[item.id].quantitySold += item.quantity;
            productSales[item.id].totalRevenue += item.price * item.quantity;
        }));
        const topProductsData = Object.entries(productSales).map(([productId, salesData]) => ({ id: productId, name: products.find(p => p.id === productId)?.name || 'N/A', ...salesData })).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);
        setTopProducts(topProductsData);

        const detailedItems: DetailedSaleItem[] = [];
        filtered.forEach(t => t.items.forEach(item => {
            detailedItems.push({
                date: new Date(t.date).toLocaleString('th-TH'),
                name: item.name,
                quantity: item.quantity,
                cost: item.cost || 0,
                price: item.price,
                totalProfit: (item.price - (item.cost || 0)) * item.quantity,
            });
        }));
        setDetailedSaleItems(detailedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, [transactions, products, dateRange]);

    const handleExportExcel = () => {
        if (!summary) return;
        const wb = XLSX.utils.book_new();

        const summaryData = [
            ["รายงานยอดขายสรุป"],
            ["ช่วงวันที่:", `${format(dateRange?.from || new Date(), 'dd/MM/yyyy')} - ${format(dateRange?.to || new Date(), 'dd/MM/yyyy')}`], [],
            ['หัวข้อ', 'ค่า'],
            ['ยอดขายรวม (บาท)', summary.totalRevenue.toFixed(2)],
            ['กำไรรวม (บาท)', summary.totalProfit.toFixed(2)],
            ['จำนวนบิลทั้งหมด', summary.transactionCount],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "สรุปยอดขาย");

        const topProductsData = topProducts.map((p, i) => ({ '#': i + 1, 'สินค้าขายดี': p.name, 'จำนวน': p.quantitySold, 'ยอดขาย': p.totalRevenue.toFixed(2) }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topProductsData), "สินค้าขายดี");

        const detailedSalesData = detailedSaleItems.map(item => ({ 'วันที่': item.date, 'ชื่อสินค้า': item.name, 'จำนวน': item.quantity, 'ทุน/หน่วย': item.cost.toFixed(2), 'ขาย/หน่วย': item.price.toFixed(2), 'กำไรรวม': item.totalProfit.toFixed(2) }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailedSalesData), "การขายแบบละเอียด");

        XLSX.writeFile(wb, `Report_Excel_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    // --- 🚀 CHANGE START: ฟังก์ชันส่งออกเป็น PDF แบบใหม่ ---
    const handlePrintToPDF = () => {
        if (!summary || !dateRange?.from) return;

        const toDate = dateRange.to ?? dateRange.from;
        const reportTitle = `รายงานยอดขาย วันที่ ${format(dateRange.from, 'dd/MM/yyyy')} ถึง ${format(toDate, 'dd/MM/yyyy')}`;

        // สร้าง HTML สำหรับหน้าพิมพ์
        const printContent = `
            <html>
                <head>
                    <title>${reportTitle}</title>
                    <style>
                        body { font-family: sans-serif; font-size: 10pt; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        h1, h2 { color: #333; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${reportTitle}</h1>

                    <h2>สรุปยอดขาย</h2>
                    <table>
                        <tr><th>ยอดขายรวม</th><td>${summary.totalRevenue.toFixed(2)} บาท</td></tr>
                        <tr><th>กำไรรวม</th><td>${summary.totalProfit.toFixed(2)} บาท</td></tr>
                        <tr><th>จำนวนบิล</th><td>${summary.transactionCount}</td></tr>
                    </table>

                    <h2>10 อันดับสินค้าขายดี</h2>
                    <table>
                        <thead><tr><th>#</th><th>ชื่อสินค้า</th><th>จำนวน (ชิ้น)</th><th>ยอดขาย (บาท)</th></tr></thead>
                        <tbody>
                            ${topProducts.map((p, i) => `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.quantitySold}</td><td>${p.totalRevenue.toFixed(2)}</td></tr>`).join('')}
                        </tbody>
                    </table>
                    
                    <h2>ประวัติการขายแบบละเอียด</h2>
                    <table>
                         <thead><tr><th>วันที่</th><th>ชื่อสินค้า</th><th>จำนวน</th><th>ทุน/หน่วย</th><th>ขาย/หน่วย</th><th>กำไรรวม</th></tr></thead>
                         <tbody>
                            ${detailedSaleItems.map(item => `<tr><td>${item.date}</td><td>${item.name}</td><td>${item.quantity}</td><td>${item.cost.toFixed(2)}</td><td>${item.price.toFixed(2)}</td><td>${item.totalProfit.toFixed(2)}</td></tr>`).join('')}
                         </tbody>
                    </table>
                </body>
            </html>
        `;

        // เปิดหน้าต่างใหม่แล้วสั่งพิมพ์
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(printContent);
        printWindow?.document.close();
        printWindow?.focus();
        printWindow?.print();
    };
    // --- 🚀 CHANGE END ---

    const setDatePreset = (preset: 'today' | 'last7' | 'thisMonth') => {
        const today = new Date();
        if (preset === 'today') setDateRange({ from: today, to: today });
        else if (preset === 'last7') setDateRange({ from: subDays(today, 6), to: today });
        else if (preset === 'thisMonth') setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        setShowDatePicker(false);
    };

    return (
        <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary-500/20">
                            <FileText className="h-8 w-8 text-primary-400" />
                        </div>
                        รายงานสรุปยอดขาย
                    </h1>
                    <p className="text-slate-400 mt-2 ml-1">วิเคราะห์ยอดขายและดูสถิติร้านค้า</p>
                </div>

                <div className="card p-3 flex flex-col md:flex-row items-center gap-3 overflow-visible z-20">
                    <div className="relative">
                        <button onClick={() => setShowDatePicker(!showDatePicker)} className="btn-secondary flex items-center gap-2 px-4 py-2 bg-black/20 text-slate-300 hover:text-white border-white/10">
                            <Calendar size={18} className="text-primary-400" />
                            <span className="font-medium">
                                {dateRange?.from && format(dateRange.from, 'd MMM yy', { locale: th })}
                                {dateRange?.to && dateRange.from?.getTime() !== dateRange.to?.getTime() ? ` - ${format(dateRange.to, 'd MMM yy', { locale: th })}` : ''}
                            </span>
                        </button>
                        {showDatePicker && (
                            <div className="absolute top-full right-0 mt-2 bg-slate-900 rounded-xl shadow-glass border border-white/10 p-2 flex animate-slide-up z-50">
                                <div className="p-2 border-r border-white/10">
                                    <DayPicker
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        locale={th}
                                        numberOfMonths={1}
                                        modifiersClassNames={{
                                            selected: 'bg-primary-600 text-white hover:bg-primary-500' // Custom styles needed for day picker often
                                        }}
                                        styles={{
                                            day: { color: '#cbd5e1' },
                                            caption: { color: '#f8fafc' }
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col space-y-2 pl-2 w-32 justify-center">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">เลือกด่วน</h4>
                                    <button onClick={() => setDatePreset('today')} className="btn-secondary !justify-start w-full text-xs">วันนี้</button>
                                    <button onClick={() => setDatePreset('last7')} className="btn-secondary !justify-start w-full text-xs">7 วันล่าสุด</button>
                                    <button onClick={() => setDatePreset('thisMonth')} className="btn-secondary !justify-start w-full text-xs">เดือนนี้</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden md:block"></div>
                    <div className="flex gap-2">
                        <button onClick={handleExportExcel} className="btn-secondary flex items-center gap-2 !px-4 text-emerald-400 hover:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10"><Download size={18} /> Excel</button>
                        <button onClick={handlePrintToPDF} className="btn-primary flex items-center gap-2 !px-4 shadow-lg shadow-primary-500/20"><Download size={18} /> PDF</button>
                    </div>
                </div>
            </div>

            {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="card p-6 flex flex-col bg-gradient-to-br from-white/10 to-white/5 border-white/10">
                        <h4 className="text-sm font-medium text-slate-400 mb-1">ยอดขายรวม</h4>
                        <p className="text-3xl font-bold text-white tracking-tight">{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <span className="text-xs text-primary-300 mt-2 bg-primary-500/10 w-fit px-2 py-1 rounded-md">บาท</span>
                    </div>
                    <div className="card p-6 flex flex-col bg-gradient-to-br from-white/10 to-white/5 border-white/10">
                        <h4 className="text-sm font-medium text-slate-400 mb-1">กำไรรวม</h4>
                        <p className="text-3xl font-bold text-emerald-400 tracking-tight">{summary.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <span className="text-xs text-emerald-300 mt-2 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">บาท</span>
                    </div>
                    <div className="card p-6 flex flex-col bg-gradient-to-br from-white/10 to-white/5 border-white/10">
                        <h4 className="text-sm font-medium text-slate-400 mb-1">จำนวนบิล</h4>
                        <p className="text-3xl font-bold text-blue-400 tracking-tight">{summary.transactionCount.toLocaleString()}</p>
                        <span className="text-xs text-blue-300 mt-2 bg-blue-500/10 w-fit px-2 py-1 rounded-md">รายการ</span>
                    </div>
                    <div className="card p-6 flex flex-col bg-gradient-to-br from-white/10 to-white/5 border-white/10">
                        <h4 className="text-sm font-medium text-slate-400 mb-1">สินค้าที่ขายได้</h4>
                        <p className="text-3xl font-bold text-purple-400 tracking-tight">{summary.itemCount.toLocaleString()}</p>
                        <span className="text-xs text-purple-300 mt-2 bg-purple-500/10 w-fit px-2 py-1 rounded-md">ชิ้น</span>
                    </div>
                    <div className="card p-6 flex flex-col bg-gradient-to-br from-white/10 to-white/5 border-white/10">
                        <h4 className="text-sm font-medium text-slate-400 mb-1">ยอดเฉลี่ย/บิล</h4>
                        <p className="text-3xl font-bold text-amber-400 tracking-tight">{summary.averageSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <span className="text-xs text-amber-300 mt-2 bg-amber-500/10 w-fit px-2 py-1 rounded-md">บาท/บิล</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card p-6 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400"><Star size={20} /></div>
                        <div>
                            <h3 className="font-bold text-white text-lg">10 อันดับสินค้าขายดี</h3>
                            <p className="text-xs text-slate-400">เรียงตามจำนวนที่ขายได้</p>
                        </div>
                    </div>
                    <div className="overflow-auto custom-scrollbar flex-grow">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-white/5 sticky top-0 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">#</th>
                                    <th className="px-4 py-3">สินค้า</th>
                                    <th className="px-4 py-3 text-center">จำนวน</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">ยอดขาย</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {topProducts.map((p, index) => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                                        <td className="px-4 py-3 text-center font-bold text-primary-300">{p.quantitySold}</td>
                                        <td className="px-4 py-3 text-right text-slate-300">{p.totalRevenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Daily sales chart */}
                <div className="card p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400"><TrendingUp size={20} /></div>
                        <div>
                            <h3 className="font-bold text-white text-lg">ยอดขายตามช่วงเวลา</h3>
                            <p className="text-xs text-slate-400">ยอดขายรวมรายวันในช่วงที่เลือก</p>
                        </div>
                    </div>
                    <div className="flex-grow min-h-[260px]">
                        {chartData.values.length > 0 ? (
                            <Bar
                                data={{
                                    labels: chartData.labels,
                                    datasets: [{
                                        label: 'ยอดขาย',
                                        data: chartData.values,
                                        backgroundColor: 'rgba(79, 70, 229, 0.55)',
                                        borderColor: 'rgba(79, 70, 229, 1)',
                                        borderWidth: 1,
                                        borderRadius: 6,
                                    }],
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false }, title: { display: false } },
                                    scales: {
                                        y: { beginAtZero: true, ticks: { callback: (v: number | string) => '฿' + Number(v).toLocaleString() } },
                                        x: { grid: { display: false } },
                                    },
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">ไม่มีข้อมูลยอดขายในช่วงที่เลือก</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card p-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><FileText size={20} /></div>
                    <h3 className="font-bold text-white text-lg">ประวัติการขายแบบละเอียด</h3>
                </div>
                <div className="overflow-auto custom-scrollbar max-h-[500px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-white/5 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">วันที่</th>
                                <th className="px-4 py-3">สินค้า</th>
                                <th className="px-4 py-3 text-center">จำนวน</th>
                                <th className="px-4 py-3 text-right">ทุน</th>
                                <th className="px-4 py-3 text-right">ขาย</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">กำไร</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {detailedSaleItems.map((item, index) => (
                                <tr key={index} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.date}</td>
                                    <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                                    <td className="px-4 py-3 text-center text-slate-300">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right text-slate-400 font-mono">{item.cost.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-slate-300 font-mono">{item.price.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono">+{item.totalProfit.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;