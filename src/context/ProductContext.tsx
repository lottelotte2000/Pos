import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Product } from '../types';

interface ProductContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product | null;
  updateProduct: (id: string, dataToUpdate: Partial<Omit<Product, 'id' | 'createdAt'>>) => boolean;
  updateProductStock: (productId: string, quantityChange: number) => boolean;
  deleteProduct: (id: string) => boolean;
  findProductById: (id: string) => Product | undefined;
  findProductByBarcode: (barcode: string) => Product | undefined;
  searchProducts: (term: string) => Product[];
  getLowStockProducts: (threshold?: number) => Product[];
  bulkImportProducts: (productsToImport: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => { addedCount: number; updatedCount: number; errors: string[] };
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product | null => {
    if (!productData.name || productData.price === undefined || productData.stock === undefined) return null;

    // Check if product with same barcode already exists
    if (productData.barcode) {
      const existingProductIndex = products.findIndex(p => p.barcode === productData.barcode);
      if (existingProductIndex !== -1) {
        const existingProduct = products[existingProductIndex];
        const updatedProduct = {
          ...existingProduct,
          ...productData,
          stock: existingProduct.stock + productData.stock, // Add to existing stock
          updatedAt: new Date().toISOString()
        };
        
        setProducts(prev => {
          const newProducts = [...prev];
          newProducts[existingProductIndex] = updatedProduct;
          return newProducts;
        });
        
        return updatedProduct;
      }
    }

    const newProduct: Product = { ...productData, id: `prod-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  }, [products]);

  const updateProduct = useCallback((id: string, dataToUpdate: Partial<Omit<Product, 'id' | 'createdAt'>>): boolean => {
    let found = false;
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        found = true;
        return { ...p, ...dataToUpdate, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
    return found;
  }, []);

  const updateProductStock = useCallback((productId: string, quantityChange: number): boolean => {
    let productFound = false;
    setProducts(prevProducts => {
      const productIndex = prevProducts.findIndex(p => p.id === productId);
      if (productIndex === -1) return prevProducts;
      productFound = true;
      const productToUpdate = prevProducts[productIndex];
      const newStock = productToUpdate.stock + quantityChange;
      const updatedProducts = [...prevProducts];
      updatedProducts[productIndex] = { ...productToUpdate, stock: newStock, updatedAt: new Date().toISOString() };
      return updatedProducts;
    });
    return productFound;
  }, []);

  const deleteProduct = useCallback((id: string): boolean => {
    let found = false;
    setProducts(prev => {
      const newProducts = prev.filter(p => p.id !== id);
      if (newProducts.length < prev.length) found = true;
      return newProducts;
    });
    return found;
  }, []);

  const findProductById = useCallback((id: string): Product | undefined => products.find(p => p.id === id), [products]);
  const findProductByBarcode = useCallback((barcode: string): Product | undefined => products.find(p => p.barcode === barcode), [products]);

  const searchProducts = useCallback((term: string): Product[] => {
    if (!term.trim()) return [];
    const lowerTerm = term.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lowerTerm) || p.barcode.includes(lowerTerm));
  }, [products]);

  const getLowStockProducts = useCallback((threshold = 5): Product[] => products.filter(p => p.stock <= threshold), [products]);
  
  const bulkImportProducts = useCallback((productsToImport: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): { addedCount: number; updatedCount: number; errors: string[] } => {
    const results = { addedCount: 0, updatedCount: 0, errors: [] as string[] };
    
    setProducts(prev => {
      const newProducts = [...prev];
      
      productsToImport.forEach(pImport => {
        // Check if exists by barcode
        let existingIndex = -1;
        if (pImport.barcode) {
          existingIndex = newProducts.findIndex(p => p.barcode === pImport.barcode);
        }

        if (existingIndex !== -1) {
          // Update existing
          const existing = newProducts[existingIndex];
          newProducts[existingIndex] = {
            ...existing,
            ...pImport,
            stock: existing.stock + pImport.stock, // Add stock
            updatedAt: new Date().toISOString()
          };
          results.updatedCount++;
        } else {
          // Add new
          const newProduct = { ...pImport, id: `prod-${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          newProducts.push(newProduct);
          results.addedCount++;
        }
      });
      return newProducts;
    });
    return results;
  }, []);


  return (
    <ProductContext.Provider value={{
      products,
      setProducts,
      addProduct,
      updateProduct,
      updateProductStock,
      deleteProduct,
      findProductById,
      findProductByBarcode,
      searchProducts,
      getLowStockProducts,
      bulkImportProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};