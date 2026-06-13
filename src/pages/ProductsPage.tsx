import React, { useState, useMemo, useRef } from 'react';
import { useProducts } from '../context/ProductContext';
import { Product } from '../types';
import { Plus, Search, Package, Edit, Trash2, Upload, Loader2, Image as ImageIcon, LayoutGrid, List, Tag } from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 100;

// Maps Thai keyboard characters (Kedmanee layout) → ASCII equivalents for barcode scanning.
// Fixes: when OS input is set to Thai, barcode scanner sends Thai characters instead of digits/symbols.
const thaiToQwertyMap: Record<string, string> = {
    'ๅ': '1', '/': '2', '-': '3', 'ภ': '4', 'ถ': '5', 'ุ': '6', 'ึ': '7', 'ค': '8', 'ต': '9', 'จ': '0',
    'ข': '-', 'ช': '_',
    '+': '+', '๑': '!', '๒': '@', '๓': '#', '๔': '$', 'ู': '%', '฿': '^', '๕': '&', '๖': '*', '๗': '(', '"': ')',
};

const translateThaiBarcode = (raw: string): string =>
    raw.split('').map(c => thaiToQwertyMap[c] ?? c).join('');

// Type for a raw imported row (before validation)
interface ImportedProductRow {
    name?: unknown;
    barcode?: unknown;
    price?: unknown;
    cost?: unknown;
    stock?: unknown;
    imageUrl?: unknown;
    category?: unknown;
    description?: unknown;
}

// ProductForm Component
const ProductForm: React.FC<{
    product?: Product;
    onSubmit: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel: () => void;
    categories: string[];
}> = ({ product, onSubmit, onCancel, categories }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        barcode: product?.barcode || '',
        price: product?.price || 0,
        cost: product?.cost || 0,
        stock: product?.stock || 0,
        imageUrl: product?.imageUrl || '',
        category: product?.category || '',
        description: product?.description || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    // Barcode-specific handler: auto-translates Thai keyboard chars so scanners work even with Thai input
    const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, barcode: translateThaiBarcode(e.target.value) }));
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); };

    // อัปโหลดรูปจากไฟล์ → ย่อขนาด (กว้าง/สูงไม่เกิน 400px) แล้วเก็บเป็น dataURL ใน imageUrl
    const imageInputRef = useRef<HTMLInputElement>(null);
    const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const max = 400;
                let { width, height } = img;
                if (width > height && width > max) { height = Math.round(height * max / width); width = max; }
                else if (height > max) { width = Math.round(width * max / height); height = max; }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                setFormData(prev => ({ ...prev, imageUrl: canvas.toDataURL('image/jpeg', 0.8) }));
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl shadow-glass w-full max-w-2xl transform transition-all animate-slide-up">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
                                {product ? <Edit size={20} /> : <Plus size={20} />}
                            </div>
                            {product ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
                        </h3>
                        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                            <div className="sr-only">Close</div>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">ชื่อสินค้า</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="input-style w-full" placeholder="ระบุชื่อสินค้า" required />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">คำอธิบายสินค้า (ไม่บังคับ)</label>
                            <textarea name="description" id="description" value={formData.description} onChange={handleChange} className="input-style w-full resize-none" rows={2} placeholder="รายละเอียดเพิ่มเติม..." />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-300 mb-1">รูปภาพสินค้า</label>
                            <div className="flex gap-4 items-center">
                                <div className="flex-grow flex flex-col gap-2">
                                    <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleChange} className="input-style w-full" placeholder="วาง URL รูป หรือกดอัปโหลดจากเครื่อง" />
                                    <div className="flex gap-2">
                                        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                                        <button type="button" onClick={() => imageInputRef.current?.click()} className="btn btn-secondary !py-2 text-sm">
                                            <Upload size={16} /> อัปโหลดรูป
                                        </button>
                                        {formData.imageUrl && (
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))} className="btn btn-secondary !py-2 text-sm text-red-400 border-red-500/30 hover:bg-red-500/10">
                                                <Trash2 size={16} /> ลบรูป
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="w-20 h-20 rounded-lg bg-slate-800 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                    {formData.imageUrl ? <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-600" />}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="barcode" className="block text-sm font-medium text-slate-300 mb-1">บาร์โค้ด</label>
                            <div className="relative">
                                <input type="text" name="barcode" id="barcode" value={formData.barcode} onChange={handleBarcodeChange} className="input-style w-full pl-10" placeholder="สแกนหรือพิมพ์" />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Search size={16} /></div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">หมวดหมู่</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="category"
                                    id="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="input-style w-full pl-10"
                                    placeholder="พิมพ์หรือเลือกหมวดหมู่"
                                    list="category-suggestions"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Tag size={16} /></div>
                                <datalist id="category-suggestions">
                                    {categories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="stock" className="block text-sm font-medium text-slate-300 mb-1">จำนวนในสต็อก</label>
                            <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} className="input-style w-full" min="0" />
                        </div>

                        <div>
                            <label htmlFor="cost" className="block text-sm font-medium text-slate-300 mb-1">ราคาทุน (บาท)</label>
                            <input type="number" name="cost" id="cost" value={formData.cost} onChange={handleChange} className="input-style w-full" min="0" step="0.01" />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="price" className="block text-sm font-medium text-slate-300 mb-1">ราคาขาย (บาท)</label>
                            <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} className="input-style w-full border-primary-500/50 focus:border-primary-500 bg-primary-500/5" min="0" step="0.01" required />
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 rounded-b-2xl">
                        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors font-medium">ยกเลิก</button>
                        <button type="submit" className="btn-primary px-8 py-2.5 shadow-lg shadow-primary-500/20">บันทึกข้อมูล</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Main ProductsPage
const ProductsPage: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct, bulkImportProducts } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Derived list of unique categories
    const categories = useMemo(() => {
        const cats = products.map(p => p.category).filter((c): c is string => !!c);
        return Array.from(new Set(cats)).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products
            .filter(p => {
                const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
                const matchCategory = !categoryFilter || p.category === categoryFilter;
                return matchSearch && matchCategory;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [products, searchTerm, categoryFilter]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const processImportedRows = (rows: ImportedProductRow[]): Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> => {
        const result: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> = [];
        rows.forEach(row => {
            const price = parseFloat(String(row.price ?? ''));
            const stock = parseInt(String(row.stock ?? '0'), 10);
            if (row.name && !isNaN(price) && !isNaN(stock)) {
                result.push({
                    name: String(row.name),
                    barcode: String(row.barcode || ''),
                    price,
                    cost: parseFloat(String(row.cost ?? '0')) || 0,
                    stock,
                    imageUrl: String(row.imageUrl || ''),
                    category: row.category ? String(row.category) : undefined,
                    description: row.description ? String(row.description) : undefined,
                });
            }
        });
        return result;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportMessage(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;

                let rows: ImportedProductRow[] = [];

                if (file.name.endsWith('.json')) {
                    const parsed: unknown = JSON.parse(data as string);
                    let arr: unknown[] = [];
                    if (Array.isArray(parsed)) {
                        arr = parsed;
                    } else if (
                        parsed !== null &&
                        typeof parsed === 'object' &&
                        'appData' in parsed &&
                        Array.isArray((parsed as { appData: { products?: unknown[] } }).appData?.products)
                    ) {
                        arr = (parsed as { appData: { products: unknown[] } }).appData.products;
                    } else {
                        throw new Error('รูปแบบไฟล์ไม่ถูกต้อง (ต้องเป็น Array หรือไฟล์ Backup ที่มี appData.products)');
                    }
                    rows = arr as ImportedProductRow[];

                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    rows = XLSX.utils.sheet_to_json<ImportedProductRow>(sheet);

                } else {
                    throw new Error('ไฟล์ไม่รองรับ (รองรับ .json, .xlsx, .xls, .csv)');
                }

                if (rows.length === 0) throw new Error('ไม่พบข้อมูลสินค้าในไฟล์');

                const productsToImport = processImportedRows(rows);
                if (productsToImport.length > 0) {
                    const result = bulkImportProducts(productsToImport);
                    setImportMessage(`นำเข้าสำเร็จ: เพิ่ม ${result.addedCount} รายการ, อัปเดต ${result.updatedCount} รายการ`);
                } else {
                    setImportMessage('ไม่พบข้อมูลที่ถูกต้องสำหรับนำเข้าในไฟล์ (ตรวจสอบคอลัมน์ name, price, stock)');
                }

            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                setImportMessage('เกิดข้อผิดพลาด: ' + msg);
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsBinaryString(file);
        } else {
            reader.readAsText(file, 'UTF-8');
        }
    };

    const handleOpenForm = (product?: Product) => { setEditingProduct(product); setShowForm(true); };
    const handleCloseForm = () => { setEditingProduct(undefined); setShowForm(false); };
    const handleSubmit = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (editingProduct) {
            updateProduct(editingProduct.id, data);
        } else {
            addProduct(data);
        }
        handleCloseForm();
    };
    const handleDelete = () => { if (productToDelete) { deleteProduct(productToDelete.id); setProductToDelete(null); } };
    const handlePageChange = (newPage: number) => { if (newPage > 0 && newPage <= totalPages) { setCurrentPage(newPage); } };

    return (
        <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary-500/20">
                            <Package className="h-8 w-8 text-primary-400" />
                        </div>
                        จัดการสต็อกสินค้า
                    </h1>
                    <p className="text-slate-400 mt-2 ml-1">มีสินค้าทั้งหมด {products.length} รายการ (แสดง {paginatedProducts.length} รายการ)</p>
                </div>

                <div className="flex items-center gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".json,.xlsx,.xls,.csv" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary" disabled={isImporting}>
                        {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        <span>นำเข้าไฟล์</span>
                    </button>
                    <button onClick={() => handleOpenForm()} className="btn btn-primary">
                        <Plus size={20} /><span>เพิ่มสินค้าใหม่</span>
                    </button>
                </div>
            </div>

            <div className="card p-4 sticky top-24 z-30 flex flex-col md:flex-row justify-between items-center gap-4 border-white/10 backdrop-blur-xl bg-slate-900/80">
                <div className="relative flex-grow w-full md:w-auto md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อสินค้า หรือ บาร์โค้ด..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="input-style w-full pl-10"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {categories.length > 0 && (
                        <select
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                            className="input-style !py-2 appearance-none"
                        >
                            <option value="">ทุกหมวดหมู่</option>
                            {categories.map(c => (
                                <option key={c} value={c} className="text-slate-800">{c}</option>
                            ))}
                        </select>
                    )}
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <LayoutGrid size={20} />
                        </button>
                        <button onClick={() => setViewMode('table')} className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                            <List size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {importMessage && (
                <div className={`border p-4 rounded-xl text-sm flex items-center gap-3 animate-slide-up ${importMessage.startsWith('เกิดข้อผิดพลาด') ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-primary-500/10 border-primary-500/20 text-primary-300'}`}>
                    {importMessage}
                    <button onClick={() => setImportMessage(null)} className="ml-auto text-slate-400 hover:text-white">✕</button>
                </div>
            )}

            {filteredProducts.length === 0 ? (
                <div className="card py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Package size={48} className="text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{searchTerm || categoryFilter ? 'ไม่พบสินค้าที่ตรงกัน' : 'ยังไม่มีสินค้า'}</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        {searchTerm || categoryFilter ? 'ลองเปลี่ยนคำค้นหา หรือตรวจสอบตัวสะกด' : 'เริ่มต้นด้วยการเพิ่มสินค้าใหม่ หรือนำเข้าข้อมูลจากไฟล์ JSON/Excel'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {paginatedProducts.map(product => (
                        <div className="h-full" key={product.id}>
                            <ProductCard product={product} onEdit={handleOpenForm} onDelete={setProductToDelete} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/5 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4 text-left font-semibold w-20">รูปภาพ</th>
                                    <th className="p-4 text-left font-semibold">ชื่อสินค้า / บาร์โค้ด</th>
                                    <th className="p-4 text-left font-semibold">หมวดหมู่</th>
                                    <th className="p-4 text-right font-semibold">ราคาขาย</th>
                                    <th className="p-4 text-center font-semibold">สต็อก</th>
                                    <th className="p-4 text-center font-semibold w-24">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-3">
                                            <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden border border-white/5">
                                                {product.imageUrl
                                                    ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-slate-600" /></div>
                                                }
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-white text-base">{product.name}</div>
                                            <div className="text-primary-400/70 font-mono text-xs mt-1">{product.barcode || '-'}</div>
                                        </td>
                                        <td className="p-4">
                                            {product.category
                                                ? <span className="px-2 py-1 rounded-md bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs">{product.category}</span>
                                                : <span className="text-slate-600 text-xs">-</span>
                                            }
                                        </td>
                                        <td className="p-4 text-right font-bold text-emerald-400 text-base">{product.price.toFixed(2)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${product.stock <= 5 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-700/50 text-slate-300 border-transparent'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenForm(product)} className="p-2 hover:bg-white/10 rounded-lg text-primary-400 transition-colors" title="แก้ไข"><Edit size={16} /></button>
                                                <button onClick={() => setProductToDelete(product)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors" title="ลบ"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-8">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="btn btn-secondary !px-4 disabled:opacity-50">ก่อนหน้า</button>
                    <span className="text-sm text-slate-500 bg-white/5 px-4 py-2 rounded-lg border border-white/5">หน้า <span className="text-white font-bold">{currentPage}</span> จาก {totalPages}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="btn btn-secondary !px-4 disabled:opacity-50">ถัดไป</button>
                </div>
            )}

            {showForm && (
                <ProductForm
                    product={editingProduct}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseForm}
                    categories={categories}
                />
            )}

            {productToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-glass w-full max-w-sm p-6 text-center animate-scale-in">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">ยืนยันการลบสินค้า</h3>
                        <p className="my-3 text-sm text-slate-400 leading-relaxed">คุณต้องการลบสินค้า <br /><span className="font-semibold text-white text-base">"{productToDelete.name}"</span> <br />ออกจากระบบใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                        <div className="mt-8 flex justify-center gap-3">
                            <button onClick={() => setProductToDelete(null)} className="btn-secondary flex-1 py-3 justify-center">ยกเลิก</button>
                            <button onClick={handleDelete} className="btn bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/30 flex-1 py-3 justify-center rounded-xl font-semibold">ยืนยันการลบ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
