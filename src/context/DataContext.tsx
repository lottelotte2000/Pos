import { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { Transaction, AppData, User } from '../types';
import { useProducts } from './ProductContext';
import { useSettings } from './SettingsContext';

// ... (Interface declarations for electronAPI remain the same) ...


interface DataContextType {
  transactions: Transaction[];
  users: User[];
  isDataLoaded: boolean;
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'date'>) => string | null;
  voidTransaction: (id: string, voidedBy?: string) => boolean;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  updateUser: (id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'password'>> & { password?: string }) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (id: string) => boolean;
  findUserByUsername: (username: string) => User | undefined;
  bulkImportUsers: (usersToImport: User[]) => Promise<{ addedCount: number; updatedCount: number; skippedUsernameCount: number }>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsersState] = useState<User[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const dataLoadedRef = useRef(false);

  // Get setters from new contexts
  const { setProducts, products, updateProductStock } = useProducts();
  const { setReceiptSettings, setCustomerDisplaySettings, setSoundSettings, setPosSettings, receiptSettings, customerDisplaySettings, soundSettings, posSettings } = useSettings();

  // Load initial data and populate all contexts
  useEffect(() => {
    const loadData = async () => {
      if (window.electronAPI) {
        try {
          const savedData = await window.electronAPI.readData();
          if (savedData) {
            setProducts(savedData.products || []);
            setTransactions(savedData.transactions || []);
            setUsersState(savedData.users || []);
            setReceiptSettings(savedData.receiptSettings);
            setCustomerDisplaySettings(savedData.customerDisplaySettings);
            if (savedData.soundSettings) {
              setSoundSettings(savedData.soundSettings);
            }
            if (savedData.posSettings) {
              setPosSettings(savedData.posSettings);
            }
          }
        } catch (error) {
          console.error('[DataContext] Error loading data:', error);
        }
      }
      setIsDataLoaded(true);
      dataLoadedRef.current = true;
    };
    loadData();
  }, [setProducts, setReceiptSettings, setCustomerDisplaySettings, setSoundSettings, setPosSettings]);

  // Save data back to file
  useEffect(() => {
    if (!dataLoadedRef.current || !window.electronAPI) return;

    const appDataToSave: AppData = { products, transactions, users, receiptSettings, customerDisplaySettings, soundSettings, posSettings };

    const saveTimer = setTimeout(async () => {
      try {
        await window.electronAPI!.writeData(appDataToSave);
      } catch (error) {
        console.error('[DataContext] Error saving data:', error);
      }
    }, 1500); // Increased debounce time slightly

    return () => clearTimeout(saveTimer);
  }, [products, transactions, users, receiptSettings, customerDisplaySettings, soundSettings, posSettings]);

  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id' | 'date'>): string | null => {
    if (!transactionData?.items?.length || !transactionData.cashierId) return null;
    const newTransaction: Transaction = { ...transactionData, id: `trans-${Date.now()}`, date: new Date().toISOString() };
    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction.id;
  }, []);

  // ยกเลิก/คืนเงินบิล: คืนสต็อกสินค้าแต่ละรายการ แล้วทำเครื่องหมายว่าบิลถูกยกเลิก
  const voidTransaction = useCallback((id: string, voidedBy?: string): boolean => {
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.voided) return false;
    // คืนสต็อก (รายการที่ไม่ใช่สินค้าจริง เช่น เติมเงิน จะไม่พบ product → ข้ามไปเอง)
    tx.items.forEach(item => updateProductStock(item.id, item.quantity));
    setTransactions(prev => prev.map(t => t.id === id
      ? { ...t, voided: true, voidedAt: new Date().toISOString(), voidedBy }
      : t));
    return true;
  }, [transactions, updateProductStock]);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
    if (!window.electronAPI) {
      return { success: false, message: "Electron API not available." };
    }
    const result = await window.electronAPI.createUser(userData);
    if (result.success && result.user) {
      setUsersState(prev => [...prev, result.user!]);
    }
    return result;
  }, []);

  const updateUser = useCallback(async (id: string, dataToUpdate: Partial<Omit<User, 'id' | 'createdAt' | 'password'>> & { password?: string }): Promise<{ success: boolean; message?: string }> => {
    // ป้องกันไม่ให้ลดสิทธิ์ admin คนสุดท้าย (ต้องมี admin อย่างน้อย 1 คนเสมอ)
    if (dataToUpdate.role && dataToUpdate.role !== 'admin') {
      const target = users.find(u => u.id === id);
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (target?.role === 'admin' && adminCount <= 1) {
        return { success: false, message: 'ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน ไม่สามารถเปลี่ยนบทบาทได้' };
      }
    }

    if (!window.electronAPI?.updateUser) {
      // Fallback (เช่นรันบนเว็บ): อัปเดต state ในหน่วยความจำเท่านั้น (ไม่ hash รหัสผ่าน)
      let found = false;
      setUsersState(prev => prev.map(u => { if (u.id === id) { found = true; return { ...u, ...dataToUpdate }; } return u; }));
      return { success: found, message: found ? undefined : 'User not found.' };
    }

    const result = await window.electronAPI.updateUser(id, dataToUpdate);
    if (result.success && result.user) {
      setUsersState(prev => prev.map(u => (u.id === id ? result.user! : u)));
    }
    return result;
  }, [users]);

  const deleteUser = useCallback((id: string): boolean => {
    const userToDelete = users.find(u => u.id === id);
    if (!userToDelete) return false;

    // ป้องกันไม่ให้ลบ admin คนสุดท้าย (มิฉะนั้นจะล็อกตัวเองออกจากระบบ)
    if (userToDelete.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        console.warn('[DataContext] deleteUser: cannot delete the last admin account.');
        return false;
      }
    }

    let found = false;
    setUsersState(prev => { const newUsers = prev.filter(u => u.id !== id); if (newUsers.length < prev.length) found = true; return newUsers; });
    return found;
  }, [users]);

  const findUserByUsername = useCallback((username: string): User | undefined => users.find(u => u.username.toLowerCase() === username.toLowerCase()), [users]);

  const bulkImportUsers = useCallback(async (usersToImport: User[]): Promise<{ addedCount: number; updatedCount: number; skippedUsernameCount: number }> => {
    let addedCount = 0;
    let updatedCount = 0;
    let skippedUsernameCount = 0;

    // Use a local mutable snapshot so duplicate checks within the same batch are accurate.
    // React state (users) won't reflect additions mid-loop since setState is async.
    let currentUsers = [...users];

    for (const user of usersToImport) {
      const existingUserById = user.id ? currentUsers.find(u => u.id === user.id) : null;
      const existingUserByName = currentUsers.find(u => u.username === user.username);

      if (existingUserById) {
        // Update existing user
        const result = await updateUser(existingUserById.id, user);
        if (result.success) {
          currentUsers = currentUsers.map(u => u.id === existingUserById.id ? { ...u, ...user } : u);
          updatedCount++;
        }
      } else if (existingUserByName) {
        // Skip: username already taken by a different account
        skippedUsernameCount++;
      } else {
        // Create new user
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, ...userData } = user;
        const result = await addUser(userData);
        if (result.success) {
          // Add to local snapshot so subsequent iterations see this user
          currentUsers.push({ ...user });
          addedCount++;
        }
      }
    }
    return { addedCount, updatedCount, skippedUsernameCount };
  }, [users, addUser, updateUser]);

  const contextValue = {
    transactions, users, isDataLoaded,
    addTransaction, voidTransaction, addUser, updateUser,
    deleteUser, findUserByUsername, bulkImportUsers
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};