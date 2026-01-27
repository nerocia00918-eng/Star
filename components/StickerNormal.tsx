import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ProductData, CampaignMode } from '../types';
import { formatPrice } from '../utils/dataUtils';
import * as Icons from 'lucide-react';

interface StickerNormalProps {
  product: ProductData;
  campaign: CampaignMode;
}

const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] || Icons.Info;
  return <IconComponent className={className} />;
};

export const StickerNormal: React.FC<StickerNormalProps> = ({ product, campaign }) => {
  // Color Logic
  const isFlashSale = campaign === CampaignMode.FL;
  const isGiaSoc = campaign === CampaignMode.GV;
  
  const headerColor = isFlashSale ? 'bg-red-600' : 'bg-orange-500';
  const priceColor = isFlashSale || isGiaSoc ? 'text-red-600' : 'text-red-600';
  
  // Use sale price if campaign is active
  const displayPrice = (isFlashSale || isGiaSoc) && product.salePrice ? product.salePrice : product.price;
  const listPrice = product.price;

  return (
    <div className="w-full h-full bg-white border border-gray-300 flex flex-col overflow-hidden relative text-xs">
      {/* Header */}
      <div className={`${headerColor} text-white p-2 h-[28%] flex items-center`}>
        <div className="w-[18%] h-full bg-white p-1 mr-2 flex items-center justify-center rounded-sm">
           <QRCodeSVG value={product.link} size={48} />
        </div>
        <div className="flex-1 font-bold leading-tight text-center line-clamp-3 text-[11px] uppercase">
          {product.name}
        </div>
      </div>

      {/* Body Table */}
      <div className="flex-1 flex flex-col justify-start w-full">
        {product.specs.slice(0, 6).map((spec, index) => (
          <div 
            key={index} 
            className={`flex items-center border-b border-gray-300 h-[16.6%] ${index % 2 === 0 ? 'bg-orange-50' : 'bg-white'}`}
          >
            {/* Label Column */}
            <div className="w-[35%] flex items-center pl-1 border-r border-gray-300 h-full font-medium text-gray-700">
               <DynamicIcon name={spec.icon} className="w-3 h-3 mr-1 text-blue-500" />
               <span className="truncate text-[10px]">{spec.label}</span>
            </div>
            {/* Value Column */}
            <div className="w-[65%] flex items-center justify-center h-full px-1 text-center font-bold text-gray-800 text-[10px] line-clamp-1">
               {spec.value}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Price Area */}
      <div className="h-[18%] flex border-t-2 border-gray-400">
        <div className="w-[35%] flex items-center justify-center font-bold text-gray-700 bg-white border-r border-gray-300 text-[10px]">
          <span className="text-yellow-600 mr-1">💰</span> GIÁ NIÊM YẾT
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-white relative">
          <div className={`text-xl font-black ${priceColor} leading-none`}>
            {formatPrice(displayPrice)}
          </div>
           {/* If campaign, show original price struck through small */}
           {(isFlashSale || isGiaSoc) && (
             <div className="text-[9px] text-gray-400 line-through absolute bottom-0 right-1">
               {formatPrice(listPrice)}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};