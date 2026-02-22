import { CATEGORY_MAPPINGS, SMALL_SIZE_PREFIXES } from '../constants';
import { ProductData, CategoryConfig } from '../types';

// Mock function to simulate a database lookup based on patterns
export const generateProductFromCode = (code: string): ProductData => {
  // Normalize: 
  // 1. Remove ALL whitespace (spaces, tabs, etc) - This fixes "V . RX" or copy-paste gaps
  // 2. Remove invisible characters (zero-width spaces, etc.)
  // 3. Normalize various dot characters to standard dot '.'
  const normalizedCode = code
    .replace(/\s+/g, '') 
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[。．․]/g, '.');
    
  const lowerCode = normalizedCode.toLowerCase();
  
  // Determine Category Prefix
  let prefix = 'default';
  
  // Check exact prefixes first
  // SORT BY LENGTH DESCENDING to ensure 'lt.' matches before 'l.'
  const knownPrefixes = Object.keys(CATEGORY_MAPPINGS).sort((a, b) => b.length - a.length);
  
  for (const p of knownPrefixes) {
    if (lowerCode.startsWith(p)) {
      prefix = p;
      break;
    }
  }

  // Handle r4/r5 logic if not caught above (though they are in keys)
  if (prefix === 'default') {
    if (lowerCode.startsWith('r4')) prefix = 'r4.';
    if (lowerCode.startsWith('r5')) prefix = 'r5.';
  }

  const categoryConfig: CategoryConfig = CATEGORY_MAPPINGS[prefix] || CATEGORY_MAPPINGS['default'];

  // Generate Dummy Specs
  const specs = categoryConfig.fields.map(field => ({
    label: field.label,
    icon: field.icon,
    value: field.default || '...'
  }));

  // Generate a plausible link
  // Logic: Remove prefix, convert to kebab-case
  const shortName = lowerCode.replace(/\./g, '-').replace(/\s+/g, '-');
  const link = `https://tinhocngoisao.com/products/${shortName}`;

  // Default to 0/Empty as requested by user, so they can fill it in.
  const price = 0;
  
  // Generate Empty Specs (labels only)
  const specs = categoryConfig.fields.map(field => ({
    label: field.label,
    icon: field.icon,
    value: '' // Leave empty for user to fill
  }));

  return {
    code: normalizedCode,
    name: `${categoryConfig.name} - ${normalizedCode.toUpperCase()}`,
    price: price,
    salePrice: 0, 
    link: link,
    specs: specs,
    category: prefix
  };
};

export const parseInputCodes = (input: string): ProductData[] => {
  if (!input) return [];
  
  return input.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(code => generateProductFromCode(code));
};

export const formatPrice = (price: number): string => {
  if (!price || price === 0) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price).replace('₫', '');
};

export const isSmallSize = (code: string): boolean => {
  const lower = code.toLowerCase();
  return SMALL_SIZE_PREFIXES.some(prefix => lower.startsWith(prefix));
};