import React, { useState, useEffect, useRef, useCallback } from 'react';
import CartItemList from '../components/sales/CartItemList';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useProducts } from '../context/ProductContext';
import { useSalesModals } from '../hooks/useSalesModals';
import SalesModals from '../components/sales/SalesModals';
import PaymentModal from '../components/sales/PaymentModal';
import TopUpModal from '../components/sales/TopUpModal';
import { DragonBallPowerUp } from '../components/common/DragonBallEffects';
import QuantityModal from '../components/sales/QuantityModal';
import { Product, CartItem } from '../types';
import { translateThaiBarcode } from '../utils/thaiBarcode';
import { Search, ShoppingCart, Trash2, PlusCircle, X, MonitorPlay, MonitorOff, CheckCircle, Clock, Printer, Package, Smartphone } from 'lucide-react';

const SalesPage: React.FC = () => {
    const {
        tabs, activeTabIndex, addItemToActiveTab, addCustomItemToActiveTab, removeItemFromActiveTab,
        addNewTab, switchToTab, clearActiveTab, updateTabName,
        setPaymentConfirmation, cancelPaymentConfirmation, completeActiveTabTransaction, resetCompletedTab
    } = useCart();

    const { soundSettings, posSettings, updatePosSettings } = useSettings();

    const { searchProducts, findProductByBarcode } = useProducts();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean | string>(false);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [editingItemInfo, setEditingItemInfo] = useState<{ index: number; item: CartItem } | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const cartScrollRef = useRef<HTMLDivElement>(null);
    const [isFinalizing, setIsFinalizing] = useState(false);

    const modalHandlers = useSalesModals();
    const activeTabData = tabs[activeTabIndex];
    const activeCartTotalItems = activeTabData ? activeTabData.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info', duration: number = 3000) => {
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        setNotification({ message, type });
        notificationTimerRef.current = setTimeout(() => setNotification(null), duration);
    }, []);

    const handleOpenCustomerDisplay = () => window.electronAPI?.openCustomerDisplay();
    const handleCloseCustomerDisplay = () => window.electronAPI?.closeCustomerDisplay();

    const playSound = useCallback((sound: string | undefined) => {
        if (!sound) return;
        // รองรับทั้งไฟล์เสียงมาตรฐาน (sounds/xxx.mp3) และเสียงที่อัปโหลดเอง (dataURL)
        const src = sound.startsWith('data:') ? sound : `sounds/${sound}`;
        const audio = new Audio(src);
        audio.volume = 0.5;
        audio.play().catch(e => console.error("Error playing sound:", e));
    }, []);

    const handleConfirmRemoveItem = useCallback(() => {
        if (!modalHandlers.itemToRemoveInfo) return;
        removeItemFromActiveTab(modalHandlers.itemToRemoveInfo.index, modalHandlers.itemToRemoveInfo.item.quantity);
        showNotification(`นำ "${modalHandlers.itemToRemoveInfo.item.name}" ออกจากตะกร้าแล้ว`, 'info');
        modalHandlers.handleCancelRemoveItem();
    }, [modalHandlers, removeItemFromActiveTab, showNotification]);

    const handleQuantityChangeInCart = useCallback((index: number, change: number) => {
        if (!activeTabData) return;
        const item = activeTabData.items[index];
        if (!item) return;
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0 && change < 0) {
            modalHandlers.openConfirmRemoveItemModal(item, index);
        } else {
            if (change > 0) addItemToActiveTab(item.barcode, change);
            else if (change < 0) removeItemFromActiveTab(index, Math.abs(change));
        }
    }, [activeTabData, addItemToActiveTab, removeItemFromActiveTab, modalHandlers]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim()) setSearchResults(searchProducts(searchTerm));
            else setSearchResults([]);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, searchProducts]);

    // เลื่อนกล่องตะกร้าลงล่างอัตโนมัติเมื่อมีสินค้าเพิ่ม → เห็นสินค้าชิ้นล่าสุดเสมอ
    useEffect(() => {
        const el = cartScrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, [activeTabData?.items.length]);

    const handleAddItemFromSearch = useCallback((product: Product) => {
        const success = addItemToActiveTab(product.barcode, 1);
        if (success) {
            showNotification(`เพิ่ม '${product.name}' ลงตะกร้า`, 'success');
            playSound(soundSettings?.scanSuccessSound);
        } else {
            showNotification(`ไม่สามารถเพิ่ม '${product.name}' (สต็อกไม่พอ)`, 'error');
            playSound(soundSettings?.errorSound);
        }
        setSearchTerm('');
        setSearchResults([]);
        barcodeInputRef.current?.focus();
    }, [addItemToActiveTab, showNotification, playSound, soundSettings?.errorSound, soundSettings?.scanSuccessSound]);

    // ประมวลผลบาร์โค้ดที่ยิงมา (ใช้ร่วมกันทั้งการดักคีย์ทั้งหน้าจอ และการกด Enter ในช่องค้นหา)
    const processScannedBarcode = useCallback((raw: string) => {
        const code = translateThaiBarcode(raw.trim()); // แปลงอักษรไทย→ASCII (ถ้าเป็น ASCII อยู่แล้วจะไม่เปลี่ยน)
        if (!code) { playSound(soundSettings?.emptyBarcodeSound); return; }
        const success = addItemToActiveTab(code, 1);
        if (success) {
            playSound(soundSettings?.scanSuccessSound);
        } else {
            const product = findProductByBarcode(code);
            if (product) {
                showNotification(`'${product.name}' สต็อกไม่พอ (คงเหลือ ${product.stock})`, 'error');
                playSound(soundSettings?.errorSound);
            } else {
                showNotification(`ไม่พบสินค้าสำหรับบาร์โค้ด '${code}' ในระบบ`, 'error');
                playSound(soundSettings?.productNotFoundSound);
            }
        }
        setSearchTerm('');
        barcodeInputRef.current?.focus();
    }, [addItemToActiveTab, findProductByBarcode, showNotification, playSound, soundSettings?.emptyBarcodeSound, soundSettings?.productNotFoundSound, soundSettings?.errorSound, soundSettings?.scanSuccessSound]);

    const handleBarcodeScanInput = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            processScannedBarcode((event.target as HTMLInputElement).value);
        }
    }, [processScannedBarcode]);

    const handlePaymentConfirm = (cashReceived: number, paymentMethod: string) => {
        setPaymentConfirmation(cashReceived, paymentMethod);
        setShowPaymentModal(false);
    };

    const handleHoldBill = useCallback(() => {
        if (!activeTabData || activeTabData.items.length === 0) {
            showNotification('ไม่มีรายการสินค้าให้พักบิล', 'error');
            return;
        }

        // 1. Rename current tab to indicate held status with time
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        updateTabName(activeTabIndex, `พักบิล ${timeStr}`);

        // 2. Create new tab for next customer
        addNewTab(); // This usually switches to the new tab automatically in CartContext

        showNotification('พักบิลเรียบร้อยแล้ว', 'success');

    }, [activeTabData, activeTabIndex, updateTabName, addNewTab, showNotification]);

    const handleFinalizeTransaction = useCallback(() => {
        if (isFinalizing) return;
        setIsFinalizing(true);

        const capturedTabIndex = activeTabIndex;
        const transactionId = completeActiveTabTransaction();
        if (transactionId) {
            // completeActiveTabTransaction now sets status = 'completed'
            // Both screens show the summary; reset after 3 seconds.
            // คง isFinalizing = true ไว้ตลอดช่วง 3 วินาที เพื่อกันการกดยืนยันซ้ำ
            setTimeout(() => {
                resetCompletedTab(capturedTabIndex);
                setIsFinalizing(false);
            }, 3000);
        } else {
            showNotification('เกิดข้อผิดพลาดในการบันทึกรายการ', 'error');
            setIsFinalizing(false);
        }
    }, [isFinalizing, activeTabIndex, completeActiveTabTransaction, resetCompletedTab, showNotification]);

    const handleTopUpConfirm = (provider: string, phoneNumber: string, cost: number, profit: number) => {
        // ลูกค้าจ่าย = ต้นทุน + กำไร ; บันทึก cost = ต้นทุนจริง (รายงานกำไรจะได้ถูกต้อง)
        const price = cost + profit;
        addCustomItemToActiveTab({
            id: `topup-${Date.now()}`,
            barcode: `TOPUP-${provider}-${phoneNumber || 'nophone'}-${Date.now()}`,
            name: `เติมเงิน ${provider} ${cost}฿${phoneNumber ? ` - ${phoneNumber}` : ''}`,
            price,
            quantity: 1,
            stock: 9999,
            cost
        });
        setShowTopUpModal(false);
        showNotification(`เพิ่มรายการเติมเงิน ${provider} ${cost} บาท (รับเงิน ${price} บาท)`, 'success');
    };

    // โฟกัสช่องสแกนอัตโนมัติ — สลับแท็บ, เปิดบิลใหม่หลังจบการขาย (status กลับเป็น active), และเมื่อปิด modal
    // เพื่อให้ยิงสินค้าชิ้นถัดไปได้ทันทีโดยไม่ต้องคลิกช่องเอง
    useEffect(() => {
        if (activeTabData?.status && activeTabData.status !== 'active') return;
        if (showPaymentModal || showTopUpModal || showQuantityModal) return;
        const t = setTimeout(() => barcodeInputRef.current?.focus(), 60);
        return () => clearTimeout(t);
    }, [activeTabIndex, activeTabData?.status, showPaymentModal, showTopUpModal, showQuantityModal]);

    // ✅ ดักการยิงบาร์โค้ดจากเครื่องสแกนทั้งหน้าจอ โดยใช้ "รหัสปุ่มจริง" (event.code)
    // ทำให้ยิงได้เหมือนกันไม่ว่า IME จะเป็นไทยหรืออังกฤษ (event.code ไม่ขึ้นกับภาษา) และไม่ต้องโฟกัสช่องก่อน
    useEffect(() => {
        let buffer = '';
        let lastTs = 0;
        const codeToChar = (code: string): string => {
            if (/^Digit[0-9]$/.test(code)) return code.charAt(5);
            if (/^Numpad[0-9]$/.test(code)) return code.charAt(6);
            if (/^Key[A-Z]$/.test(code)) return code.charAt(3);
            const sym: Record<string, string> = { Minus: '-', Slash: '/', Period: '.', Backslash: '\\' };
            return sym[code] || '';
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (showPaymentModal || showTopUpModal || showQuantityModal) return;
            if (activeTabData?.status && activeTabData.status !== 'active') return;

            const now = Date.now();
            if (now - lastTs > 50) buffer = ''; // เว้นช่วงนาน = พิมพ์ด้วยมือ ไม่ใช่สแกนเนอร์ (สแกนเนอร์ยิงเร็ว < 50ms/ตัว)
            lastTs = now;

            if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                if (buffer.length >= 4) {
                    const scanned = buffer;
                    buffer = '';
                    e.preventDefault();
                    e.stopPropagation();
                    processScannedBarcode(scanned);
                }
                return;
            }
            const ch = codeToChar(e.code);
            if (ch) buffer += ch;
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [showPaymentModal, showTopUpModal, showQuantityModal, activeTabData?.status, processScannedBarcode]);

    // Handle Global Keyboard Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            // Priority 1: Handle Modal/Confirmation ESC/Enter
            if (activeTabData?.status === 'confirming_payment') {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    handleFinalizeTransaction();
                } else if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelPaymentConfirmation();
                }
                return;
            }

            // Priority 2: General Shortcuts (F-Keys)

            // ESC: Close Modals
            if (event.key === 'Escape') {
                if (showPaymentModal) setShowPaymentModal(false);
                if (showTopUpModal) setShowTopUpModal(false);
                // Also close search results if open?
                if (searchTerm) setSearchTerm('');
                return;
            }

            // Only process shortcuts if no modal is open (except for ESC above)
            if (showPaymentModal || showTopUpModal) return;

            // F4: Cash Payment
            if (event.key === 'F4') {
                event.preventDefault();
                if (activeTabData && activeTabData.items.length > 0) {
                    setShowPaymentModal('cash');
                } else {
                    showNotification('ตะกร้าสินค้าว่างเปล่า', 'error');
                }
                return;
            }

            // F7: PromptPay Payment
            if (event.key === 'F7') {
                event.preventDefault();
                if (activeTabData && activeTabData.items.length > 0) {
                    setShowPaymentModal('promptpay');
                } else {
                    showNotification('ตะกร้าสินค้าว่างเปล่า', 'error');
                }
                return;
            }

            // F5: New Customer (New Tab)
            if (event.key === 'F5') {
                event.preventDefault();
                addNewTab();
                showNotification('เปิดบิลใหม่เรียบร้อย', 'success');
                return;
            }

            // F8: Remove Last Item
            if (event.key === 'F8') {
                event.preventDefault();
                if (activeTabData && activeTabData.items.length > 0) {
                    const lastIndex = activeTabData.items.length - 1;
                    const item = activeTabData.items[lastIndex];
                    // Directly remove or confirm? Let's confirm to be safe, reusing existing modal logic
                    modalHandlers.openConfirmRemoveItemModal(item, lastIndex);
                }
                return;
            }

            // F3: Edit Quantity (Last Item)
            if (event.key === 'F3') {
                event.preventDefault();
                if (activeTabData && activeTabData.items.length > 0) {
                    const lastIndex = activeTabData.items.length - 1;
                    const item = activeTabData.items[lastIndex];
                    setEditingItemInfo({ index: lastIndex, item });
                    setShowQuantityModal(true);
                }
                return;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [activeTabData, showPaymentModal, showTopUpModal, showQuantityModal, searchTerm, handleFinalizeTransaction, cancelPaymentConfirmation, addNewTab, modalHandlers, handleQuantityChangeInCart, showNotification]);

    const handlePrintReceipt = useCallback(() => {
        if (!activeTabData) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const rows = activeTabData.items
            .map(i => '<tr><td>' + i.name + '</td><td style="text-align:center">' + i.quantity + '</td><td style="text-align:right">' + (i.price * i.quantity).toFixed(2) + '</td></tr>')
            .join('');
        const cashSection = activeTabData.paymentMethod === 'cash'
            ? '<div style="display:flex;justify-content:space-between"><span>รับมา</span><span>' + (activeTabData.cashReceived ?? 0).toFixed(2) + '</span></div><div style="display:flex;justify-content:space-between"><b><span>เงินทอน</span><span>' + (activeTabData.changeAmount ?? 0).toFixed(2) + '</span></b></div>'
            : '';
        const html = '<html><head><title>ใบเสร็จ</title>'
            + '<style>body{font-family:sans-serif;font-size:10pt;width:72mm;margin:0 auto}'
            + 'table{width:100%;border-collapse:collapse}td,th{padding:3px 4px}'
            + 'hr{border:1px dashed #000}@media print{body{margin:0}}</style>'
            + '</head><body>'
            + '<div style="text-align:center"><p style="font-weight:bold;margin:4px 0">ใบเสร็จ</p>'
            + '<p style="margin:2px 0">' + new Date().toLocaleString('th-TH') + '</p></div>'
            + '<hr/><table><tr><th style="text-align:left">รายการ</th><th>จำนวน</th><th style="text-align:right">รวม</th></tr>'
            + rows + '</table><hr/>'
            + '<div style="display:flex;justify-content:space-between"><span>รวม</span><b><span>' + activeTabData.total.toFixed(2) + ' บาท</span></b></div>'
            + cashSection
            + '</body></html>';
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }, [activeTabData]);

    const handleQuantityModalConfirm = (newQuantity: number) => {
        if (editingItemInfo && activeTabData) {
            const currentQty = editingItemInfo.item.quantity;
            const diff = newQuantity - currentQty;
            if (diff !== 0) {
                handleQuantityChangeInCart(editingItemInfo.index, diff);
            }
        }
        setShowQuantityModal(false);
        setEditingItemInfo(null);
    };

    return (
        // ความสูงตายตัว = viewport ลบ header(pt-20=5rem) และ padding ล่าง(pb-6=1.5rem)
        // เพื่อให้ overflow ภายใน (รายการตะกร้า) ทำงาน และยอดรวม/สุทธิ ล็อกอยู่ล่างเสมอ
        <div className="flex flex-col h-[calc(100vh-6.5rem)]" style={{ backgroundColor: 'transparent' }}>
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-5 px-5 py-3 rounded-xl shadow-2xl text-white z-[100] animate-slide-up flex items-center gap-3 text-sm font-medium
                    ${notification.type === 'error' ? 'bg-red-600' : notification.type === 'success' ? 'bg-emerald-600' : 'bg-primary-600'}`}>
                    {notification.type === 'success' && <CheckCircle size={18} />}
                    {notification.message}
                </div>
            )}

            {/* Top Bar: Customer Display + Tabs */}
            <div className="flex-shrink-0 flex items-center gap-3 mb-4">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 flex-grow overflow-x-auto custom-scrollbar pb-1">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            onClick={() => switchToTab(index)}
                            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                                activeTabIndex === index
                                    ? 'bg-primary-600 text-white border-transparent'
                                    : 'text-slate-500 border-white/[0.07] hover:text-slate-200 hover:bg-white/5'
                            }`}
                            style={activeTabIndex !== index ? { backgroundColor: 'var(--color-bg-surface)' } : {}}
                        >
                            <ShoppingCart size={14} />
                            {tab.name}
                            <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTabIndex === index ? 'bg-white/20' : 'bg-white/5 text-slate-500'}`}>
                                {tab.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                            {tabs.length > 1 && (
                                <div onClick={(e) => { e.stopPropagation(); modalHandlers.openCloseTabConfirmModal(index, tab); }}
                                    className="ml-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all">
                                    <X size={12} />
                                </div>
                            )}
                        </button>
                    ))}
                    <button onClick={() => addNewTab()}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors border border-white/[0.07]"
                        style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                        <PlusCircle size={18} />
                    </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => setShowTopUpModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors border border-white/[0.07]"
                        style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                        <Smartphone size={16} className="text-emerald-400" /> เติมเงิน
                    </button>
                    <button onClick={handleOpenCustomerDisplay}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors border border-white/[0.07]"
                        style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                        <MonitorPlay size={16} className="text-primary-500" /> จอเสริม
                    </button>
                    <button onClick={handleCloseCustomerDisplay}
                        className="p-2 rounded-xl text-slate-600 hover:text-slate-400 transition-colors border border-white/[0.07]"
                        style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                        <MonitorOff size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            {/* lg:grid-rows-1 = minmax(0,1fr) บังคับให้แถวสูงเท่าพื้นที่จริง ไม่ยืดตามจำนวนสินค้า
                (กันไม่ให้ส่วนยอดรวม/สุทธิถูกดันหลุดลงล่างเวลาสินค้าเยอะ) */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 gap-4 overflow-hidden min-h-0">

                {/* Left: Product Search */}
                <div className="lg:col-span-5 flex flex-col gap-3 overflow-hidden min-h-0 rounded-2xl p-4"
                    style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>

                    {/* Search */}
                    <div className="relative flex-shrink-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            ref={barcodeInputRef}
                            type="text"
                            placeholder="ค้นหาสินค้า หรือ สแกนบาร์โค้ด..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleBarcodeScanInput}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                            style={{ backgroundColor: 'var(--color-bg-surface2)', border: '1px solid var(--color-border)' }}
                        />
                    </div>

                    {/* Results */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {searchResults.map(product => (
                                    <div key={product.id}
                                        onClick={() => handleAddItemFromSearch(product)}
                                        className="rounded-xl p-3.5 cursor-pointer hover:border-primary-500/50 transition-all flex flex-col gap-2 group"
                                        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                                    >
                                        <div className="h-14 w-14 rounded-xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform"
                                            style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                                            <Package size={28} className="text-primary-500" />
                                        </div>
                                        <p className="font-medium text-slate-200 text-sm text-center line-clamp-2 leading-tight">{product.name}</p>
                                        <p className="text-primary-500 font-bold text-center">฿{product.price.toFixed(2)}</p>
                                        <p className="text-[11px] text-slate-600 text-center">คงเหลือ {product.stock}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center">
                                <Search size={40} className="text-slate-700 mb-3" />
                                <p className="text-slate-600 text-sm">พิมพ์ชื่อสินค้า หรือ สแกนบาร์โค้ด</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Cart */}
                <div className="lg:col-span-7 flex flex-col overflow-hidden min-h-0 rounded-2xl"
                    style={{ backgroundColor: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>

                    {/* Cart Header */}
                    <div className="px-4 py-3 flex justify-between items-center flex-shrink-0"
                        style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={18} className="text-slate-500" />
                            <span className="font-semibold text-slate-200 text-sm">ตะกร้าสินค้า</span>
                            {activeCartTotalItems > 0 && (
                                <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">{activeCartTotalItems}</span>
                            )}
                        </div>
                        <button
                            onClick={() => modalHandlers.openClearCartConfirmModal()}
                            disabled={!activeTabData || activeTabData.items.length === 0}
                            className="text-xs text-red-500 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            ล้างตะกร้า
                        </button>
                    </div>

                    {/* Cart Items — min-h-0 เพื่อให้ scroll ภายในแทนที่จะดันยอดรวมหลุดลงล่าง */}
                    <div ref={cartScrollRef} className="flex-grow min-h-0 overflow-y-auto custom-scrollbar">
                        {activeTabData && activeTabData.items.length > 0 ? (
                            <CartItemList
                                items={activeTabData.items}
                                onQuantityChange={handleQuantityChangeInCart}
                                onEditRequest={() => {}}
                                onRequestRemoveItem={(index) => modalHandlers.openConfirmRemoveItemModal(activeTabData.items[index], index)}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-2">
                                <ShoppingCart size={40} className="text-slate-700" />
                                <p className="text-slate-600 text-sm">ยังไม่มีสินค้าในตะกร้า</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Section */}
                    {activeTabData && activeTabData.items.length > 0 && activeTabData.status === 'active' && (
                        <div className="flex-shrink-0 p-4 flex flex-col gap-3"
                            style={{ borderTop: '1px solid var(--color-border)' }}>

                            {/* Totals */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>รวม</span>
                                    <span>{activeTabData.total.toFixed(2)} บาท</span>
                                </div>
                                <div className="flex justify-between text-slate-100 text-xl font-bold pt-1.5"
                                    style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <span>สุทธิ</span>
                                    <span className="text-primary-500">฿{activeTabData.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <button
                                    onClick={handleHoldBill}
                                    className="py-3 rounded-xl font-semibold text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/[0.07]"
                                    style={{ backgroundColor: 'var(--color-bg-surface2)' }}
                                >
                                    <Clock size={16} /> พักบิล
                                </button>
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="db-pay-btn py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> ชำระเงิน
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Change Confirmation Modal */}
            {activeTabData?.status === 'confirming_payment' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
                    <div className="rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl"
                        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                        <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center bg-emerald-500/20 rounded-full">
                            <CheckCircle size={36} className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">ทำรายการสำเร็จ!</h2>
                        <div className="flex justify-between items-center text-slate-500 text-sm mt-4">
                            <span>ยอดชำระ</span>
                            <span className="text-slate-300">{activeTabData.total.toFixed(2)} บาท</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 text-sm mt-1.5">
                            <span>รับมา</span>
                            <span className="text-slate-300">{activeTabData.cashReceived?.toFixed(2) ?? '0.00'} บาท</span>
                        </div>

                        <div className="mt-5 mb-6 py-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-base)' }}>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1">เงินทอน</p>
                            <p className="text-5xl font-black text-emerald-400 leading-none">
                                {activeTabData.changeAmount?.toFixed(2) ?? '0.00'}
                            </p>
                            <p className="text-slate-600 text-sm mt-1">บาท</p>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handlePrintReceipt}
                                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors border border-white/[0.07]"
                                style={{ backgroundColor: 'var(--color-bg-surface2)' }}>
                                <Printer size={16} /> พิมพ์
                            </button>
                            <button onClick={cancelPaymentConfirmation} disabled={isFinalizing}
                                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium transition-colors border border-white/[0.07]"
                                style={{ backgroundColor: 'var(--color-bg-surface2)' }}>
                                แก้ไข
                            </button>
                            <button onClick={handleFinalizeTransaction} disabled={isFinalizing}
                                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-colors">
                                {isFinalizing ? 'กำลังบันทึก...' : 'เสร็จสิ้น (Enter)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Completed Overlay — shows for 3 seconds then auto-resets */}
            {activeTabData?.status === 'completed' && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
                    {/* เอฟเฟกต์พลังธีม Dragon Ball (แสดงเฉพาะธีมนี้) */}
                    <DragonBallPowerUp />
                    <div className="rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl"
                        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                        <div className="mx-auto mb-5 w-20 h-20 flex items-center justify-center bg-emerald-500/20 rounded-full">
                            <CheckCircle size={44} className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-1">ทำรายการสำเร็จ!</h2>

                        <div className="flex justify-between items-center text-slate-500 text-sm mt-4">
                            <span>ยอดชำระ</span>
                            <span className="text-slate-300">{activeTabData.total.toFixed(2)} บาท</span>
                        </div>

                        {activeTabData.paymentMethod === 'cash' && (
                            <>
                                <div className="flex justify-between items-center text-slate-500 text-sm mt-1.5">
                                    <span>รับมา</span>
                                    <span className="text-slate-300">
                                        {activeTabData.cashReceived?.toFixed(2) ?? '0.00'} บาท
                                    </span>
                                </div>
                                <div className="mt-5 mb-4 py-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-base)' }}>
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1">เงินทอน</p>
                                    <p className="text-5xl font-black text-emerald-400 leading-none">
                                        {activeTabData.changeAmount?.toFixed(2) ?? '0.00'}
                                    </p>
                                    <p className="text-slate-600 text-sm mt-1">บาท</p>
                                </div>
                            </>
                        )}

                        {/* Progress bar countdown */}
                        <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-surface2)' }}>
                            <div
                                className="h-full rounded-full"
                                style={{
                                    backgroundColor: '#10b981',
                                    animation: 'countdownShrink 3s linear forwards',
                                }}
                            />
                        </div>
                        <p className="text-slate-600 text-xs mt-2">กำลังเปิดบิลใหม่อัตโนมัติ...</p>
                    </div>

                    <style>{`
                        @keyframes countdownShrink {
                            from { width: 100%; }
                            to   { width: 0%; }
                        }
                    `}</style>
                </div>
            )}

            <SalesModals
                showCloseTabConfirmModal={modalHandlers.showCloseTabConfirmModal}
                tabToCloseInfo={modalHandlers.tabToCloseInfo}
                onConfirmCloseTab={() => {
                    modalHandlers.handleConfirmCloseTab();
                    showNotification(`ปิดแท็บ "${modalHandlers.tabToCloseInfo?.tab.name}" เรียบร้อยแล้ว`, 'info');
                }}
                onCancelCloseTab={modalHandlers.handleCancelCloseTab}
                showClearCartConfirmModal={modalHandlers.showClearCartConfirmModal}
                activeCartName={activeTabData?.name || ''}
                activeCartTotalItems={activeCartTotalItems}
                onConfirmClearCart={() => {
                    clearActiveTab();
                    modalHandlers.handleConfirmClearCart();
                    showNotification('ล้างตะกร้าเรียบร้อยแล้ว', 'info');
                }}
                onCancelClearCart={modalHandlers.handleCancelClearCart}
                showConfirmRemoveItemModal={modalHandlers.showConfirmRemoveItemModal}
                itemToRemoveInfo={modalHandlers.itemToRemoveInfo}
                onConfirmRemoveItem={handleConfirmRemoveItem}
                onCancelRemoveItem={modalHandlers.handleCancelRemoveItem}
                showEmptyBarcodeAlert={modalHandlers.showEmptyBarcodeAlert}
                onCloseEmptyBarcodeAlert={modalHandlers.handleCloseEmptyBarcodeAlert}
            />
            {showPaymentModal && activeTabData && (
                <PaymentModal
                    total={activeTabData.total}
                    onSetConfirmation={handlePaymentConfirm}
                    onCancel={() => setShowPaymentModal(false)}
                    focusCashInput={true}
                    initialPaymentMethod={showPaymentModal === true ? 'cash' : showPaymentModal} // showPaymentModal can be string now
                />
            )}
            {showTopUpModal && (
                <TopUpModal
                    onConfirm={handleTopUpConfirm}
                    onCancel={() => setShowTopUpModal(false)}
                    amounts={posSettings?.topUpAmounts ?? []}
                    onSaveAmounts={(list) => updatePosSettings({ topUpAmounts: list })}
                />
            )}

            {showQuantityModal && editingItemInfo && (
                <QuantityModal
                    isOpen={showQuantityModal}
                    onClose={() => setShowQuantityModal(false)}
                    onConfirm={handleQuantityModalConfirm}
                    initialQuantity={editingItemInfo.item.quantity}
                    itemName={editingItemInfo.item.name}
                />
            )}

            {/* Keyboard Shortcuts Guide */}
            {/* Keyboard Shortcuts Guide - Removed from bottom */}
        </div>
    );
};
export default SalesPage;