export interface ScrapedItem {
  id: string;
  platform: string;
  listing_id: string;
  url: string;
  title: string;
  price_aud: number;
  seller_name: string;
  seller_rating: number | null;
  condition_code: string;
  condition_label: string;
  shipping_type: string | null;
  pickup_location_text: string | null;
  category_path: string;
  full_listing_text: string;
  scraped_at: string;
  gpu_name: string | null;
  vram_capacity: number | null;
  cpu_name: string | null;
  total_system_ram: number | null;
  storage: string | null;
  egpu_model: string | null;
  touchscreen_digitizer: boolean | null;
  exact_model_name: string | null;
  
  numericPrice?: number | null; // For UI sorting
}

export interface ScrapingSession {
  id: string;
  url: string;
  platform: 'ebay' | 'auto';
  status: 'idle' | 'fetching' | 'cleaning' | 'extracting' | 'completed' | 'failed';
  error?: string;
  itemCount: number;
  timestamp: string;
}

export interface ScrapingLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
