import { useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { CartItem as CartItemType, CartTab } from '../types';

// Hook นี้จะ return state และ function ทั้งหมดที่จำเป็นสำหรับการจัดการ modals
export const useSalesModals = () => {
  const { closeTab, clearActiveTab } = useCart();

  const [showCloseTabConfirmModal, setShowCloseTabConfirmModal] = useState(false);
  const [tabToCloseInfo, setTabToCloseInfo] = useState<{ index: number; tab: CartTab } | null>(null);

  const [showClearCartConfirmModal, setShowClearCartConfirmModal] = useState(false);

  const [showConfirmRemoveItemModal, setShowConfirmRemoveItemModal] = useState(false);
  const [itemToRemoveInfo, setItemToRemoveInfo] = useState<{ item: CartItemType; index: number } | null>(null);

  const [showEmptyBarcodeAlert, setShowEmptyBarcodeAlert] = useState(false);

  // --- Functions to open modals ---
  const openCloseTabConfirmModal = useCallback((index: number, tab: CartTab) => {
    setTabToCloseInfo({ index, tab });
    setShowCloseTabConfirmModal(true);
  }, []);

  const openConfirmRemoveItemModal = useCallback((item: CartItemType, index: number) => {
    setItemToRemoveInfo({ item, index });
    setShowConfirmRemoveItemModal(true);
  }, []);

  const openClearCartConfirmModal = useCallback(() => {
    setShowClearCartConfirmModal(true);
  }, []);

  const openEmptyBarcodeAlert = useCallback(() => {
    setShowEmptyBarcodeAlert(true);
  }, []);


  // --- Functions to handle modal actions ---
  const handleConfirmCloseTab = useCallback(() => {
    if (tabToCloseInfo) {
      closeTab(tabToCloseInfo.index);
    }
    setShowCloseTabConfirmModal(false);
    setTabToCloseInfo(null);
  }, [tabToCloseInfo, closeTab]);

  const handleCancelCloseTab = useCallback(() => {
    setShowCloseTabConfirmModal(false);
    setTabToCloseInfo(null);
  }, []);

  const handleConfirmClearCart = useCallback(() => {
    clearActiveTab();
    setShowClearCartConfirmModal(false);
  }, [clearActiveTab]);

  const handleCancelClearCart = useCallback(() => {
    setShowClearCartConfirmModal(false);
  }, []);

  const handleCancelRemoveItem = useCallback(() => {
    setShowConfirmRemoveItemModal(false);
    setItemToRemoveInfo(null);
  }, []);
  
  const handleCloseEmptyBarcodeAlert = useCallback(() => {
    setShowEmptyBarcodeAlert(false);
  }, []);


  return {
    // State
    showCloseTabConfirmModal,
    tabToCloseInfo,
    showClearCartConfirmModal,
    showConfirmRemoveItemModal,
    itemToRemoveInfo,
    showEmptyBarcodeAlert,
    
    // Openers
    openCloseTabConfirmModal,
    openConfirmRemoveItemModal,
    openClearCartConfirmModal,
    openEmptyBarcodeAlert,

    // Handlers
    handleConfirmCloseTab,
    handleCancelCloseTab,
    handleConfirmClearCart,
    handleCancelClearCart,
    handleCancelRemoveItem,
    handleCloseEmptyBarcodeAlert,

    // Pass-through state for remove item modal
    setItemToRemoveInfo,
  };
};