import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useData } from './DataContext';
import { useProducts } from './ProductContext';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { CartTab, CartItem, Transaction } from '../types';

interface CartContextType {
  tabs: CartTab[];
  activeTabIndex: number;
  getActiveTabData: () => CartTab | undefined;
  addItemToActiveTab: (barcode: string, quantity?: number) => boolean;
  addCustomItemToActiveTab: (item: CartItem) => void;
  removeItemFromActiveTab: (itemIndex: number, quantity?: number) => void;
  clearActiveTab: () => void;
  setPaymentConfirmation: (cashReceived: number, paymentMethod: string) => void;
  cancelPaymentConfirmation: () => void;
  completeActiveTabTransaction: () => string | null;
  resetCompletedTab: (tabIndex: number) => void;
  addNewTab: (name?: string) => void;
  switchToTab: (index: number) => void;
  closeTab: (index: number) => void;
  renameTab: (index: number, newName: string) => void;
  updateTabName: (index: number, newName: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'pos-cart-state-sync';

const createNewTab = (name: string): CartTab => ({
  id: `tab-${Date.now()}`,
  name,
  items: [],
  total: 0,
  createdAt: new Date().toISOString(),
  status: 'active',
});

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addTransaction } = useData();
  const { findProductByBarcode, updateProductStock } = useProducts();
  const { currentUser } = useAuth();
  const { posSettings } = useSettings();
  const [tabs, setTabs] = useState<CartTab[]>([createNewTab("ลูกค้า 1")]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.tabs?.length) {
          // ✅ Prevent stuck 'completed' state on load
          const sanitizedTabs = state.tabs.map((t: CartTab) =>
            t.status === 'completed' ? { ...t, status: 'active' } : t
          );
          setTabs(sanitizedTabs);
          setActiveTabIndex(state.activeTabIndex ?? 0);
        }
      }
    } catch (err) { console.error(err); } finally {
      setIsInitialized(true);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const state = JSON.parse(e.newValue);
          // Note: For storage sync, we usually WANT to see 'completed' if it just happened,
          // so we might not want to aggressively reset it here, OR we do?
          // If the main window sets it to completed, we want to see it.
          // The issue is likely initial load.
          // But to be safe, let's trust the event value for real-time sync, 
          // but maybe add a safeguard? No, for sync let's keep it as is 
          // because we WANT the customer display to show 'Success' when main window triggers it.
          setTabs(state.tabs);
          setActiveTabIndex(state.activeTabIndex);
        } catch (err) { console.error(err); }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ tabs, activeTabIndex })); }
    catch (err) { console.error(err); }
  }, [tabs, activeTabIndex, isInitialized]);

  const updateTabs = (newTabs: CartTab[], newIndex?: number) => {
    setTabs(newTabs);
    if (newIndex !== undefined) setActiveTabIndex(newIndex);
  };

  const addItemToActiveTab = useCallback((barcode: string, quantity: number = 1): boolean => {
    const newTabs = JSON.parse(JSON.stringify(tabs));
    let activeTab = newTabs[activeTabIndex];

    if (activeTab.status !== 'active') {
      const name = activeTab.name;
      newTabs[activeTabIndex] = createNewTab(name);
      activeTab = newTabs[activeTabIndex];
    }

    const product = findProductByBarcode(barcode);

    if (!product) return false; // ไม่พบสินค้า

    // ✅ ตรวจสอบสต็อกเฉพาะเมื่อเปิดการตั้งค่า "ป้องกันการขายเกินสต็อก"
    // product.stock คือสต็อกคงเหลือสด (ถูกหักตามสินค้าในตะกร้าแล้ว)
    if (posSettings.preventNegativeStock && product.stock < quantity) {
      return false; // สต็อกไม่พอ
    }

    updateProductStock(product.id, -quantity);

    const existingIndex = activeTab.items.findIndex((i: CartItem) => i.id === product.id);
    if (existingIndex > -1) {
      activeTab.items[existingIndex].quantity += quantity;
    } else {
      activeTab.items.push({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        cost: product.cost, // ✅ เพิ่มบรรทัดนี้
        quantity: quantity,
        stock: product.stock, // stock ที่แสดงในตะกร้าจะเป็นค่าก่อนการขาย
        imageUrl: product.imageUrl,
      });
    }

    activeTab.total = activeTab.items.reduce((sum: number, i: CartItem) => sum + i.price * i.quantity, 0);
    updateTabs(newTabs);
    return true;
  }, [tabs, activeTabIndex, findProductByBarcode, updateProductStock, posSettings.preventNegativeStock]);

  const clearActiveTab = useCallback(() => {
    const newTabs = JSON.parse(JSON.stringify(tabs));
    const activeTab = newTabs[activeTabIndex];
    if (!activeTab) return;
    activeTab.items.forEach((i: CartItem) => updateProductStock(i.id, i.quantity));
    newTabs[activeTabIndex] = createNewTab(activeTab.name);
    updateTabs(newTabs);
  }, [tabs, activeTabIndex, updateProductStock]);

  const removeItemFromActiveTab = useCallback((itemIndex: number, qty?: number) => {
    const newTabs = JSON.parse(JSON.stringify(tabs));
    const activeTab = newTabs[activeTabIndex];
    if (!activeTab || !activeTab.items[itemIndex] || activeTab.status !== 'active') return;

    const item = activeTab.items[itemIndex];
    const removeQty = qty ?? item.quantity;

    if (item.quantity <= removeQty) {
      activeTab.items.splice(itemIndex, 1);
    } else {
      item.quantity -= removeQty;
    }

    updateProductStock(item.id, removeQty);
    activeTab.total = activeTab.items.reduce((sum: number, i: CartItem) => sum + i.price * i.quantity, 0);
    updateTabs(newTabs);
  }, [tabs, activeTabIndex, updateProductStock]);

  const setPaymentConfirmation = useCallback((cashReceived: number, paymentMethod: string) => {
    const newTabs = JSON.parse(JSON.stringify(tabs));
    const activeTab = newTabs[activeTabIndex];
    if (!activeTab?.items.length) return;
    activeTab.status = 'confirming_payment';
    activeTab.paymentMethod = paymentMethod;
    activeTab.cashReceived = cashReceived;
    activeTab.changeAmount = paymentMethod === 'cash' ? cashReceived - activeTab.total : 0;
    updateTabs(newTabs);
  }, [tabs, activeTabIndex]);

  const cancelPaymentConfirmation = useCallback(() => {
    const newTabs = JSON.parse(JSON.stringify(tabs));
    const activeTab = newTabs[activeTabIndex];
    if (!activeTab || activeTab.status !== 'confirming_payment') return;
    activeTab.status = 'active';
    activeTab.paymentMethod = undefined;
    activeTab.cashReceived = undefined;
    activeTab.changeAmount = undefined;
    updateTabs(newTabs);
  }, [tabs, activeTabIndex]);

  const completeActiveTabTransaction = useCallback((): string | null => {
    const activeTab = tabs[activeTabIndex];
    if (!currentUser || !activeTab || activeTab.status !== 'confirming_payment') return null;

    const transactionData: Omit<Transaction, 'id' | 'date'> = {
      items: [...activeTab.items],
      totalAmount: activeTab.total,
      paymentMethod: activeTab.paymentMethod!,
      cashierId: currentUser.id,
      cashierName: currentUser.username,
      cashReceived: activeTab.cashReceived,
      changeAmount: activeTab.changeAmount,
    };

    const txId = addTransaction(transactionData);
    if (txId) {
      // Set status to 'completed' — keep payment data so both screens can display
      // the summary for 3 seconds. resetCompletedTab() will clear it afterward.
      const newTabs = JSON.parse(JSON.stringify(tabs));
      newTabs[activeTabIndex].status = 'completed';
      updateTabs(newTabs);

      return txId.toString();
    } else {
      // Revert stock if transaction fails
      activeTab.items.forEach((i: CartItem) => updateProductStock(i.id, i.quantity));
      return null;
    }
  }, [tabs, activeTabIndex, currentUser, addTransaction, updateProductStock]);

  const resetCompletedTab = useCallback((tabIndex: number) => {
    setTabs(prev => {
      const newTabs = JSON.parse(JSON.stringify(prev));
      const tab = newTabs[tabIndex];
      if (!tab || tab.status !== 'completed') return prev;
      newTabs[tabIndex] = createNewTab(tab.name);
      return newTabs;
    });
  }, []);

  const addNewTab = useCallback((name?: string) => {
    const newName = name ?? (() => {
      let n = 1;
      const used = new Set(tabs.map(t => parseInt(t.name.replace(/\D/g, ''), 10) || 0));
      while (used.has(n)) n++;
      return `ลูกค้า ${n}`;
    })();
    updateTabs([...tabs, createNewTab(newName)], tabs.length);
  }, [tabs]);

  const switchToTab = useCallback((index: number) => { if (index >= 0 && index < tabs.length) setActiveTabIndex(index); }, [tabs.length]);
  const closeTab = useCallback((i: number) => { if (tabs.length <= 1) { clearActiveTab(); return; } const newTabs = [...tabs]; newTabs[i].items.forEach((it: CartItem) => updateProductStock(it.id, it.quantity)); newTabs.splice(i, 1); updateTabs(newTabs, Math.min(i, newTabs.length - 1)); }, [tabs, updateProductStock, clearActiveTab]);
  const renameTab = useCallback((i: number, n: string) => { if (!n.trim()) return; const newTabs = [...tabs]; if (newTabs[i]) { newTabs[i].name = n.trim(); updateTabs(newTabs); } }, [tabs]);
  const getActiveTabData = useCallback(() => tabs[activeTabIndex], [tabs, activeTabIndex]);

  const addCustomItemToActiveTab = useCallback((item: CartItem) => {
    const newTabs = JSON.parse(JSON.stringify(tabs));
    let activeTab = newTabs[activeTabIndex];

    if (activeTab.status !== 'active') {
      const name = activeTab.name;
      newTabs[activeTabIndex] = createNewTab(name);
      activeTab = newTabs[activeTabIndex];
    }

    activeTab.items.push(item);
    activeTab.total = activeTab.items.reduce((sum: number, i: CartItem) => sum + i.price * i.quantity, 0);
    updateTabs(newTabs);
  }, [tabs, activeTabIndex]);

  return <CartContext.Provider value={{ tabs, activeTabIndex, getActiveTabData, addItemToActiveTab, addCustomItemToActiveTab, removeItemFromActiveTab, clearActiveTab, setPaymentConfirmation, cancelPaymentConfirmation, completeActiveTabTransaction, resetCompletedTab, addNewTab, switchToTab, closeTab, renameTab, updateTabName: renameTab }}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};