import React from 'react';
import { ProductData, PrintMode, CampaignMode } from '../types';
import { StickerNormal } from './StickerNormal';
import { StickerSmall } from './StickerSmall';

interface PrintLayoutProps {
  products: ProductData[];
  mode: PrintMode;
  campaign: CampaignMode;
  onEdit?: (product: ProductData) => void;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ products, mode, campaign, onEdit }) => {
  // Grid Configuration
  // A4 is roughly 210mm x 297mm.
  // Normal (6/page): Cell ~ 100mm x 90mm
  // Small (24/page): Cell ~ 65mm x 35mm
  
  const isNormal = mode === PrintMode.NORMAL;
  
  // Chunking logic if we wanted multiple pages, but CSS print flow handles standard wrapping fairly well.
  // To ensure perfect alignment, we usually force page breaks after specific counts.
  const itemsPerPage = isNormal ? 6 : 24;

  // We can just render a flat list and let CSS Grid handle the wrap.
  // However, for perfect A4 printing, strict sizing is needed.

  return (
    <div className="w-[210mm] bg-white mx-auto print:mx-0">
      <div 
        className={`grid ${isNormal ? 'grid-cols-2 gap-1 p-2' : 'grid-cols-4 gap-1 p-2'}`}
        style={{ 
            // Minimal gap to fit paper
        }}
      >
        {products.map((product, idx) => (
          <div 
            key={`${product.code}-${idx}`}
            className="flex items-center justify-center overflow-hidden break-inside-avoid relative group"
            style={{
                width: isNormal ? '100mm' : '48mm', // Slightly smaller than calc to avoid overflow
                height: isNormal ? '90mm' : '35mm',
                pageBreakInside: 'avoid'
            }}
            onClick={() => onEdit && onEdit(product)}
          >
            {isNormal ? (
                <StickerNormal product={product} campaign={campaign} />
            ) : (
                <StickerSmall product={product} campaign={campaign} />
            )}
            
            {/* Edit Overlay Hint */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all cursor-pointer print:hidden flex items-center justify-center pointer-events-none">
                <span className="opacity-0 group-hover:opacity-100 bg-white px-2 py-1 rounded shadow text-xs font-bold text-gray-700">
                    Click để sửa
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};