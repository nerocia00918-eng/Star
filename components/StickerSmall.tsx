import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ProductData, CampaignMode } from '../types';
import { formatPrice } from '../utils/dataUtils';

interface StickerSmallProps {
  product: ProductData;
  campaign: CampaignMode;
}

export const StickerSmall: React.FC<StickerSmallProps> = ({ product, campaign }) => {
  const isFlashSale = campaign === CampaignMode.FL;
  const isGiaSoc = campaign === CampaignMode.GV;
  
  const displayPrice = (isFlashSale || isGiaSoc) && product.salePrice ? product.salePrice : product.price;

  const headerColor = isFlashSale ? 'bg-red-600' : 'bg-orange-500';

  // Try to find warranty spec
  const warrantySpec = product.specs.find(s => s.label.toLowerCase().includes('bảo hành') || s.label.toLowerCase() === 'bh');
  const warrantyValue = warrantySpec ? warrantySpec.value : '';

  return (
    <div className="w-full h-full bg-white border border-gray-200 flex flex-row overflow-hidden text-xs">
        {/* Left: QR and Price */}
        <div className="w-[30%] flex flex-col items-center justify-center border-r border-gray-200 p-1">
            <QRCodeSVG value={product.link} size={36} />
            <div className="mt-1 font-bold text-red-600 text-[10px] whitespace-nowrap">
                {formatPrice(displayPrice)}
            </div>
        </div>
        
        {/* Right: Info */}
        <div className="flex-1 flex flex-col">
            <div className={`${headerColor} text-white text-[9px] font-bold p-1 text-center leading-tight h-[40%] flex items-center justify-center`}>
                <span className="line-clamp-2">{product.name}</span>
            </div>
            <div className="flex-1 p-1 flex flex-col justify-center text-[9px] text-gray-700 space-y-1">
                <div className="flex justify-between border-b border-gray-100">
                    <span>Mã:</span>
                    <span className="font-mono font-bold">{product.code}</span>
                </div>
                 <div className="flex justify-between">
                    <span>BH:</span>
                    <span className="font-bold">{warrantyValue}</span>
                </div>
            </div>
        </div>
    </div>
  );
};