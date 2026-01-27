import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Settings, LayoutGrid, Grid3X3, Trash2, FileText, ShoppingTag } from 'lucide-react';
import { PrintMode, CampaignMode } from './types';
import { parseInputCodes, isSmallSize } from './utils/dataUtils';
import { PrintLayout } from './components/PrintLayout';

const SAMPLE_DATA = `LT.AC.NL16-71G-71UJ
MO.LOGITECH.G102
KB.DAREU.EK87
HP.HAVIT.H2002D
SS.SAMSUNG.980
L.LG.24MP60G
P.CORSAIR.CV650
M.ASUS.B760M
F.COOLMAN.120
V.GIGA.3060
R4.KINGSTON.8G
CAP.HDMI.2M
U.KINGSTON.32G`;

const App: React.FC = () => {
  const [inputData, setInputData] = useState<string>(SAMPLE_DATA);
  const [printMode, setPrintMode] = useState<PrintMode>(PrintMode.NORMAL);
  const [campaign, setCampaign] = useState<CampaignMode>(CampaignMode.NONE);
  
  // Auto-switch mode based on first item logic? 
  // The user asked to choose Manually, but mentioned "Small will show model (**) etc".
  // Let's keep manual control as primary, but maybe show a hint.

  const products = useMemo(() => parseInputCodes(inputData), [inputData]);

  const handlePrint = () => {
    window.print();
  };

  const clearData = () => {
    if(confirm('Xóa toàn bộ danh sách?')) {
        setInputData('');
    }
  }

  // Effect to warn if mixed types in wrong layout? 
  // User said: "Select Small will show small form".
  // So we just filter or render all in the selected size.
  
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
                    <li>Chọn "In Thường" cho Sticker lớn (10x9cm).</li>
                    <li>Chọn "In Nhỏ" cho phụ kiện (6.5x3.5cm).</li>
                </ul>
            </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-300 print:bg-white p-4 print:p-0 overflow-auto flex justify-center min-h-[500px]">
            {/* The Print Sheet */}
            <div className="shadow-2xl print:shadow-none bg-white">
                <PrintLayout products={products} mode={printMode} campaign={campaign} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;