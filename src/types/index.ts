// This file defines the common data structures used across the application.

// =================================================================
// User & Authentication Types
// =================================================================
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'cashier';
  createdAt: string; // ISO 8601 date string
  password?: string;
}

// =================================================================
// Product & Inventory Types
// =================================================================
export interface Product {
  id: string;
  barcode: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

// =================================================================
// Sales & Transaction Types
// =================================================================

export interface CartItem {
  id: string;
  barcode: string;
  name: string;
  price: number;
  cost?: number; // ✅ เพิ่มบรรทัดนี้
  quantity: number;
  stock: number;
  subtotal?: number;
  imageUrl?: string;
}

export interface CartTab {
  id: string;
  name: string;
  items: CartItem[];
  total: number;
  createdAt: string; // ISO 8601 date string
  status: 'active' | 'confirming_payment' | 'completed'; // ✅ เพิ่มสถานะใหม่
  paymentMethod?: string;
  cashReceived?: number;
  changeAmount?: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO 8601 date string
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  cashierId: string;
  cashierName: string;
  cashReceived?: number;
  changeAmount?: number;
  // ✅ การยกเลิก/คืนเงินบิล
  voided?: boolean;
  voidedAt?: string; // ISO 8601 date string
  voidedBy?: string; // username ของผู้ยกเลิก
}

// =================================================================
// Settings & Configuration Types
// =================================================================

export interface PromptPayAccount {
  id: string;
  name: string; // Account Name (e.g., "Main Shop")
  number: string; // Phone or ID Card
}

export interface ReceiptSettings {
  storeName: string;
  address?: string;
  phone?: string;
  thankYouMessage?: string;
  promptPayId?: string; // Legacy: kept for migration
  promptPayName?: string; // Legacy: kept for migration
  promptPayAccounts?: PromptPayAccount[]; // ✅ New: Multiple accounts support
}

// ✅ เพิ่ม Interface สำหรับการตั้งค่าหน้าจอลูกค้า
export interface CustomerDisplaySettings {
  welcomeMessage: string;
  secondaryMessage: string;
  idleImageUrl?: string; // URL รูปภาพที่จะแสดงตอนที่ไม่มีการขาย
  thankYouTitle: string;
  thankYouSubtitle: string;
}

/**
 * Represents the entire application's data structure, useful for saving/loading state.
 */
export interface AppData {
  products: Product[];
  transactions: Transaction[];
  users: User[];
  receiptSettings: ReceiptSettings;
  // ✅ เพิ่มข้อมูลการตั้งค่าหน้าจอลูกค้า
  customerDisplaySettings: CustomerDisplaySettings;
  // ✅ เพิ่มข้อมูลการตั้งค่าเสียง
  soundSettings: SoundSettings;
  // ✅ เพิ่มข้อมูลการตั้งค่าการขาย/สต็อก
  posSettings: PosSettings;
}

export interface SoundSettings {
  paymentSuccessSound: string;
  errorSound: string;
  emptyBarcodeSound: string;
  productNotFoundSound: string;
}

// ✅ การตั้งค่าเกี่ยวกับการขายและสต็อก
export interface PosSettings {
  // เมื่อ true จะไม่อนุญาตให้เพิ่มสินค้าลงตะกร้าหากสต็อกไม่พอ (กันสต็อกติดลบ)
  // ค่าเริ่มต้นเป็น false = ขายได้แม้สต็อกจะติดลบ
  preventNegativeStock: boolean;
}
