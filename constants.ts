import { CategoryConfig } from './types';

// Icons are string references to be used with Lucide in the component
export const CATEGORY_MAPPINGS: Record<string, CategoryConfig> = {
  // Laptops
  'lt.': {
    name: 'Laptop',
    fields: [
      { label: 'CPU', icon: 'Cpu', default: 'Core i5 / Ryzen 5' },
      { label: 'RAM', icon: 'MemoryStick', default: '8GB / 16GB' },
      { label: 'Ổ cứng', icon: 'HardDrive', default: 'SSD 512GB NVMe' },
      { label: 'Màn hình', icon: 'Monitor', default: '15.6" FHD IPS' },
      { label: 'VGA', icon: 'CircuitBoard', default: 'Onboard / RTX 3050' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '12 Tháng' },
    ]
  },
  // Mouse
  'mo.': {
    name: 'Chuột (Mouse)',
    fields: [
      { label: 'DPI', icon: 'Mouse', default: '1600 - 3200 DPI' },
      { label: 'Kết nối', icon: 'Wifi', default: 'USB / Wireless' },
      { label: 'LED', icon: 'Lightbulb', default: 'RGB / Không' },
      { label: 'Switch', icon: 'ToggleLeft', default: 'Silent / Clicky' },
      { label: 'Tương thích', icon: 'Laptop', default: 'Win / Mac' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '12 Tháng' },
    ]
  },
  // Keyboard
  'kb.': {
    name: 'Bàn phím',
    fields: [
      { label: 'Loại', icon: 'Keyboard', default: 'Cơ / Giả cơ' },
      { label: 'Switch', icon: 'ToggleLeft', default: 'Blue / Red / Brown' },
      { label: 'Kết nối', icon: 'Cable', default: 'USB Type-C' },
      { label: 'LED', icon: 'Lightbulb', default: 'Rainbow / RGB' },
      { label: 'Keycap', icon: 'Type', default: 'ABS / PBT' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '12-24 Tháng' },
    ]
  },
  // SSD/HDD
  'ss.': {
    name: 'Ổ cứng (SSD/HDD)',
    fields: [
      { label: 'Dung lượng', icon: 'Database', default: '256GB / 512GB' },
      { label: 'Chuẩn', icon: 'HardDrive', default: 'SATA 3 / NVMe' },
      { label: 'Tốc độ đọc', icon: 'ArrowUp', default: '500MB/s' },
      { label: 'Tốc độ ghi', icon: 'ArrowDown', default: '450MB/s' },
      { label: 'Kích thước', icon: 'Maximize', default: '2.5" / M.2' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '36 Tháng' },
    ]
  },
  // Headphones
  'hp.': {
    name: 'Tai nghe',
    fields: [
      { label: 'Kiểu', icon: 'Headphones', default: 'Over-ear / In-ear' },
      { label: 'Kết nối', icon: 'Cable', default: '3.5mm / USB' },
      { label: 'Micro', icon: 'Mic', default: 'Có / Khử ồn' },
      { label: 'LED', icon: 'Lightbulb', default: 'RGB' },
      { label: 'Giả lập', icon: 'Speaker', default: '7.1 Surround' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '12 Tháng' },
    ]
  },
  // Monitor
  'l.': {
    name: 'Màn hình',
    fields: [
      { label: 'Kích thước', icon: 'Monitor', default: '24 inch / 27 inch' },
      { label: 'Tấm nền', icon: 'Layers', default: 'IPS / VA' },
      { label: 'Độ phân giải', icon: 'Maximize', default: 'FHD / 2K' },
      { label: 'Tần số quét', icon: 'Activity', default: '75Hz / 144Hz' },
      { label: 'Cổng', icon: 'Cable', default: 'HDMI, DP' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '24-36 Tháng' },
    ]
  },
  // PSU
  'p.': {
    name: 'Nguồn (PSU)',
    fields: [
      { label: 'Công suất', icon: 'Zap', default: '500W / 650W' },
      { label: 'Chuẩn/Hiệu suất', icon: 'Award', default: '80 Plus' },
      { label: 'Số rail', icon: 'GitMerge', default: 'Single Rail' },
      { label: 'Đầu nối Main', icon: 'CircuitBoard', default: '24-pin' },
      { label: 'Đầu nối CPU', icon: 'Cpu', default: '8-pin' },
      { label: 'Đầu nối VGA', icon: 'Monitor', default: '8-pin PCIe' },
      { label: 'Đầu nối Molex/Sata', icon: 'HardDrive', default: 'SATA/Molex' },
    ]
  },
   // Mainboard
  'm.': {
    name: 'Mainboard',
    fields: [
      { label: 'Socket', icon: 'Cpu', default: 'LGA1700 / AM5' },
      { label: 'Chipset', icon: 'Grid', default: 'B760 / B650' },
      { label: 'Khe RAM', icon: 'MemoryStick', default: '2 / 4 Slot' },
      { label: 'Hỗ trợ', icon: 'HardDrive', default: 'M.2 NVMe Gen4' },
      { label: 'Cổng xuất', icon: 'Monitor', default: 'HDMI / DP' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '36 Tháng' },
    ]
  },
   // Printer
  'mi.': {
    name: 'Máy in',
    fields: [
      { label: 'Loại', icon: 'Printer', default: 'Laser / Phun' },
      { label: 'Chức năng', icon: 'Layers', default: 'In / Scan / Copy' },
      { label: 'Tốc độ', icon: 'Activity', default: '30 trang/phút' },
      { label: 'Kết nối', icon: 'Wifi', default: 'USB / LAN / Wifi' },
      { label: 'Mực', icon: 'Droplet', default: 'Chính hãng' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '12 Tháng' },
    ]
  },
  // Cooling (Fan)
  'f.': {
    name: 'Tản nhiệt',
    fields: [
      { label: 'Loại', icon: 'Fan', default: 'Khí / Nước AIO' },
      { label: 'Socket', icon: 'Cpu', default: 'Intel / AMD' },
      { label: 'Quạt', icon: 'Wind', default: '120mm ARGB' },
      { label: 'Tốc độ', icon: 'Activity', default: '1800 RPM' },
      { label: 'Độ ồn', icon: 'Volume2', default: '< 30dBA' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '12 Tháng' },
    ]
  },
   // VGA
  'v.': {
    name: 'VGA',
    fields: [
      { label: 'Chipset', icon: 'CircuitBoard', default: 'NVIDIA / AMD' },
      { label: 'VRAM', icon: 'Database', default: '8GB GDDR6' },
      { label: 'Quạt', icon: 'Fan', default: '2 Fan / 3 Fan' },
      { label: 'Nguồn phụ', icon: 'Zap', default: '8-pin' },
      { label: 'Cổng', icon: 'Monitor', default: 'HDMI / 3xDP' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '36 Tháng' },
    ]
  },
    // RAM (r4, r5)
  'r4.': {
    name: 'RAM DDR4',
    fields: [
      { label: 'Loại', icon: 'MemoryStick', default: 'DDR4' },
      { label: 'Bus', icon: 'Activity', default: '3200MHz' },
      { label: 'Dung lượng', icon: 'Database', default: '8GB / 16GB' },
      { label: 'Tản nhiệt', icon: 'Layers', default: 'Thép / Không' },
      { label: 'LED', icon: 'Lightbulb', default: 'RGB / Non-LED' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '36 Tháng' },
    ]
  },
  'r5.': {
    name: 'RAM DDR5',
    fields: [
      { label: 'Loại', icon: 'MemoryStick', default: 'DDR5' },
      { label: 'Bus', icon: 'Activity', default: '5600MHz / 6000MHz' },
      { label: 'Dung lượng', icon: 'Database', default: '16GB / 32GB' },
      { label: 'Tản nhiệt', icon: 'Layers', default: 'Có' },
      { label: 'LED', icon: 'Lightbulb', default: 'RGB' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '36 Tháng' },
    ]
  },
   // Router
  'rt.': {
    name: 'Router Wifi',
    fields: [
      { label: 'Chuẩn', icon: 'Wifi', default: 'Wifi 5 / Wifi 6' },
      { label: 'Băng tần', icon: 'Activity', default: 'Dual Band' },
      { label: 'Tốc độ', icon: 'ArrowUp', default: 'AC1200 / AX1800' },
      { label: 'Anten', icon: 'Signal', default: '4 Anten' },
      { label: 'Cổng', icon: 'Cable', default: 'Gigabit WAN/LAN' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '24 Tháng' },
    ]
  },
  // Default fallback
  'default': {
    name: 'Linh kiện',
    fields: [
      { label: 'Thông số 1', icon: 'Info', default: '...' },
      { label: 'Thông số 2', icon: 'Info', default: '...' },
      { label: 'Thông số 3', icon: 'Info', default: '...' },
      { label: 'Thông số 4', icon: 'Info', default: '...' },
      { label: 'Thông số 5', icon: 'Info', default: '...' },
      { label: 'Bảo hành', icon: 'ShieldCheck', default: '...' },
    ]
  }
};

export const SMALL_SIZE_PREFIXES = ['cap.', 'tn.', 'u.', 'ktn.', 'mp.', 'hub'];
