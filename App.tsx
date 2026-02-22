import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Settings, LayoutGrid, Grid3X3, Trash2, FileText, ShoppingTag } from 'lucide-react';
import { PrintMode, CampaignMode, ProductData } from './types';
import { parseInputCodes, isSmallSize } from './utils/dataUtils';
import { PrintLayout } from './components/PrintLayout';
import { EditProductModal } from './components/EditProductModal';

const SAMPLE_DATA = ``;

const App: React.FC = () => {
  // Load initial state from localStorage or fallback to defaults
  const [inputData, setInputData] = useState<string>(() => {
    return localStorage.getItem('printstar_inputData') || '';
  });
  
  const [printMode, setPrintMode] = useState<PrintMode>(() => {
    return (localStorage.getItem('printstar_printMode') as PrintMode) || PrintMode.NORMAL;
  });
  
  const [campaign, setCampaign] = useState<CampaignMode>(() => {
    return (localStorage.getItem('printstar_campaign') as CampaignMode) || CampaignMode.NONE;
  });

  // Store custom overrides for products (keyed by code)
  const [customProducts, setCustomProducts] = useState<Record<string, ProductData>>(() => {
    const saved = localStorage.getItem('printstar_customProducts');
    return saved ? JSON.parse(saved) : {};
  });

  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('printstar_inputData', inputData);
  }, [inputData]);

  useEffect(() => {
    localStorage.setItem('printstar_printMode', printMode);
  }, [printMode]);

  useEffect(() => {
    localStorage.setItem('printstar_campaign', campaign);
  }, [campaign]);

  useEffect(() => {
    localStorage.setItem('printstar_customProducts', JSON.stringify(customProducts));
  }, [customProducts]);

  const products = useMemo(() => {
    const parsed = parseInputCodes(inputData);
    return parsed.map(p => {
      // 1. Exact match
      if (customProducts[p.code]) {
        return { ...customProducts[p.code], code: p.code };
      }
      
      // 2. Partial match (Fuzzy search)
      // Sort saved codes by length descending to match the most specific one first
      const savedCodes = Object.keys(customProducts).sort((a, b) => b.length - a.length);
      for (const savedCode of savedCodes) {
        // Require at least 5 characters for a partial match to avoid false positives
        if (savedCode.length >= 5) {
          const pLower = p.code.toLowerCase();
          const sLower = savedCode.toLowerCase();
          if (pLower.includes(sLower) || sLower.includes(pLower)) {
            return { ...customProducts[savedCode], code: p.code };
          }
        }
      }

      return p;
    });
  }, [inputData, customProducts]);

  const handlePrint = () => {
    window.print();
  };

  const clearData = () => {
    if(confirm('Xóa toàn bộ danh sách?')) {
        setInputData('');
    }
  }

  const handleEditProduct = (product: ProductData) => {
    setEditingProduct(product);
  };

  const handleSaveProduct = (updatedProduct: ProductData) => {
    setCustomProducts(prev => ({
      ...prev,
      [updatedProduct.code]: updatedProduct
    }));
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Control Panel - Hidden on Print */}
      <div className="bg-gray-800 text-white p-4 shadow-lg print:hidden sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-2">
                <div className="bg-orange-500 p-2 rounded-lg">
                    <Printer className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">PrintStar Pro</h1>
                    <p className="text-xs text-gray-400">Hệ thống in tem Tin Học Ngôi Sao</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center bg-gray-700 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300 flex items-center gap-1">
                        <LayoutGrid size={16}/> Kích thước:
                    </span>
                    <select 
                        value={printMode}
                        onChange={(e) => setPrintMode(e.target.value as PrintMode)}
                        className="bg-gray-600 border border-gray-500 rounded px-3 py-1 text-sm focus:outline-none focus:border-orange-500"
                    >
                        <option value={PrintMode.NORMAL}>In Thường (6 tem/A4)</option>
                        <option value={PrintMode.SMALL}>In Nhỏ (24 tem/A4)</option>
                    </select>
                </div>

                <div className="h-6 w-px bg-gray-500 hidden md:block"></div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300 flex items-center gap-1">
                        <ShoppingTag size={16}/> CTKM:
                    </span>
                    <select 
                        value={campaign}
                        onChange={(e) => setCampaign(e.target.value as CampaignMode)}
                        className="bg-gray-600 border border-gray-500 rounded px-3 py-1 text-sm focus:outline-none focus:border-orange-500"
                    >
                        <option value={CampaignMode.NONE}>Mặc định</option>
                        <option value={CampaignMode.GV}>Giá Sốc (GV)</option>
                        <option value={CampaignMode.FL}>Flash Sale (FL)</option>
                    </select>
                </div>
            </div>

            <button 
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2"
            >
                <Printer size={20} /> IN NGAY
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6 print:p-0">
        
        {/* Input Sidebar - Hidden on Print */}
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-4 print:hidden">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-gray-700 flex items-center gap-2">
                        <FileText size={18} /> Danh sách Mã
                    </h2>
                    <button onClick={clearData} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                        <Trash2 size={12} /> Xóa
                    </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                    Nhập mã sản phẩm, mỗi mã một dòng (Ví dụ: LT.AC..., MO.LOGITECH...)
                </p>
                <textarea
                    className="w-full h-96 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono text-sm"
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder="Dán mã sản phẩm vào đây..."
                ></textarea>
                <div className="mt-2 text-xs text-gray-400 text-right">
                    Đã tìm thấy: {products.length} sản phẩm
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <strong>Hướng dẫn:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-xs">
                    <li>Nhập mã vào ô bên trên.</li>
                    <li>Hệ thống tự động nhận diện loại linh kiện (LT, MO, KB...) để hiển thị thông số.</li>
                    <li>
                        <strong>Chỉnh sửa:</strong> Click vào tem bên phải để sửa thông tin (Giá, Tên, Thông số).
                    </li>
                    <li>Dữ liệu sẽ được tự động lưu vào trình duyệt.</li>
                </ul>
            </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-300 print:bg-white p-4 print:p-0 overflow-auto flex justify-center min-h-[500px]">
            {/* The Print Sheet */}
            <div className="shadow-2xl print:shadow-none bg-white">
                <PrintLayout 
                    products={products} 
                    mode={printMode} 
                    campaign={campaign} 
                    onEdit={handleEditProduct}
                />
            </div>
        </div>

      </div>

      {/* Edit Modal */}
      <EditProductModal 
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

export default App;