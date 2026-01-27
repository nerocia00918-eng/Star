export enum PrintMode {
  NORMAL = 'NORMAL', // 6 stickers per A4
  SMALL = 'SMALL',   // 24 stickers per A4
}

export enum CampaignMode {
  NONE = 'NONE',
  GV = 'GV', // Gia Soc / Gold V
  FL = 'FL', // Flash Sale
}

export interface SpecField {
  label: string;
  icon: string; // Icon name for Lucide
  value: string;
}

export interface ProductData {
  code: string;
  name: string;
  price: number;
  salePrice?: number;
  link: string;
  specs: SpecField[];
  category: string;
}

export interface CategoryConfig {
  name: string;
  fields: { label: string; icon: string; default?: string }[];
}