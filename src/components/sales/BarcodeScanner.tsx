import React, { useState, useRef } from 'react';
import { Scan, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }
    
    const result = onScan(barcode.trim());
    
    if (result) {
      setSuccess(true);
      setError('');
      setBarcode('');
      
      setTimeout(() => {
        setSuccess(false);
      }, 1500);
    } else {
      setError('Product not found or out of stock');
      setSuccess(false);
    }
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="p-4 rounded-xl cursor-text" style={{ backgroundColor: '#1e2535', border: '1px solid rgba(255,255,255,0.07)' }} onClick={focusInput}>
      <div className="flex items-center space-x-2 mb-2">
        <Scan className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium">Scan Barcode</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="flex items-stretch">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
              setError('');
            }}
            className={`w-full px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-300' : success ? 'border-green-300 bg-green-50' : 'border-gray-300'
            }`}
            placeholder="Scan or type barcode"
            autoFocus
          />
          {error && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add
        </button>
      </form>
      
      {error && (
        <p className="mt-1 text-sm text-red-500 flex items-center">
          {error}
        </p>
      )}
    </div>
  );
};

export default BarcodeScanner;