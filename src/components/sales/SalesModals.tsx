import React from 'react';
import { XSquare, Trash2, AlertTriangle } from 'lucide-react';
import { CartItem as CartItemType, CartTab } from '../../types';

interface SalesModalsProps {
  // Close Tab Modal
  showCloseTabConfirmModal: boolean;
  tabToCloseInfo: { index: number; tab: CartTab } | null;
  onConfirmCloseTab: () => void;
  onCancelCloseTab: () => void;

  // Clear Cart Modal
  showClearCartConfirmModal: boolean;
  activeCartTotalItems: number;
  activeCartName: string;
  onConfirmClearCart: () => void;
  onCancelClearCart: () => void;

  // Remove Item Modal
  showConfirmRemoveItemModal: boolean;
  itemToRemoveInfo: { item: CartItemType; index: number } | null;
  onConfirmRemoveItem: () => void;
  onCancelRemoveItem: () => void;

  // Empty Barcode Alert
  showEmptyBarcodeAlert: boolean;
  onCloseEmptyBarcodeAlert: () => void;
}

const SalesModals: React.FC<SalesModalsProps> = ({
  showCloseTabConfirmModal,
  tabToCloseInfo,
  onConfirmCloseTab,
  onCancelCloseTab,
  showClearCartConfirmModal,
  activeCartTotalItems,
  activeCartName,
  onConfirmClearCart,
  onCancelClearCart,
  showConfirmRemoveItemModal,
  itemToRemoveInfo,
  onConfirmRemoveItem,
  onCancelRemoveItem,
  showEmptyBarcodeAlert,
  onCloseEmptyBarcodeAlert
}) => {
  return (
    <>
      {/* Close Tab Confirmation Modal */}
      {showCloseTabConfirmModal && tabToCloseInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onCancelCloseTab}>
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XSquare size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">ปิดแท็บ "{tabToCloseInfo.tab.name}"?</h3>
            <p className="text-slate-400 mb-6 text-sm">
              รายการสินค้าในตะกร้านี้จะถูกคืนสต็อกและหายไป <br /> คุณแน่ใจหรือไม่ที่จะปิด?
            </p>
            <div className="flex gap-3">
              <button onClick={onCancelCloseTab} className="flex-1 btn btn-secondary justify-center">ยกเลิก</button>
              <button onClick={onConfirmCloseTab} className="flex-1 btn btn-danger justify-center">ปิดแท็บ</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearCartConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onCancelClearCart}>
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">ล้างตะกร้า "{activeCartName}"?</h3>
            <p className="text-slate-400 mb-6 text-sm">
              สินค้าทั้งหมด {activeCartTotalItems} รายการ จะถูกลบออกจากตะกร้าและคืนสต็อก
            </p>
            <div className="flex gap-3">
              <button onClick={onCancelClearCart} className="flex-1 btn btn-secondary justify-center">ยกเลิก</button>
              <button onClick={onConfirmClearCart} className="flex-1 btn btn-danger justify-center">ล้างตะกร้า</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Item Confirmation Modal */}
      {showConfirmRemoveItemModal && itemToRemoveInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onCancelRemoveItem}>
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start mb-4 gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10">
                  <Trash2 className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ยืนยันการลบสินค้า</h3>
                <div className="mt-2">
                  <p className="text-slate-300 text-sm">
                    คุณต้องการลบสินค้า <span className="font-semibold text-white">"{itemToRemoveInfo.item.name}"</span> <br />
                    (จำนวน: {itemToRemoveInfo.item.quantity}) ออกจากตะกร้าใช่หรือไม่?
                  </p>
                  <p className="mt-2 text-xs text-red-400 font-medium">การดำเนินการนี้จะคืนสต็อกสินค้าเข้าระบบ</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onCancelRemoveItem} className="btn btn-secondary">ยกเลิก</button>
              <button type="button" onClick={onConfirmRemoveItem} className="btn btn-danger">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Barcode Alert */}
      {showEmptyBarcodeAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onCloseEmptyBarcodeAlert}>
          <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">ไม่พบสินค้า</h3>
            <p className="text-slate-400 mb-6 text-sm">
              กรุณาระบุบาร์โค้ดหรือชื่อสินค้าที่ต้องการค้นหา
            </p>
            <button onClick={onCloseEmptyBarcodeAlert} className="w-full btn btn-primary justify-center">ตกลง</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesModals;