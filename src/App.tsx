import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { 
  Database,
  Info,
  Edit3,
  SlidersHorizontal,
  ListFilter,
  Layers, 
  Search, 
  Settings, 
  Download, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Plus, 
  X,
  Edit2,
  Check,
  Clipboard,
  Clock
} from "lucide-react";
import { ScrapedItem, ScrapingLog } from "./types";

export default function App() {
  const [items, setItems] = useState<ScrapedItem[]>([]);
  const [logs, setLogs] = useState<ScrapingLog[]>([]);
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<'ebay' | 'amazon' | 'gumtree' | 'facebook' | 'generic' | 'other' | 'auto'>("auto");
  const [engine, setEngine] = useState<'infatica' | 'instant'>('infatica');
  const [manualHtml, setManualHtml] = useState("");
  const [delayMs, setDelayMs] = useState<number>(2000);
  const [isScraping, setIsScraping] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "scraped-new" | "title-asc">("scraped-new");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAddManualForm, setShowAddManualForm] = useState(false);
  const [manualItemForm, setManualItemForm] = useState<Partial<ScrapedItem>>({
    title: "", price: "", condition: "", location: "", platform: "other", url: ""
  });

const loadDemoData = () => {
    setItems([
      {
        id: "demo-laptop-1",
        
        full_listing_text: "Lenovo ThinkPad T480s 14\" FHD i7-8650U 16GB 512GB NVMe SSD Windows 11 ProCondition: Used - Very GoodPrice: $249.99Shipping: $15.00 Standard ShippingSeller: thinkpad_refurbs (99.8% positive feedback)Location: Austin, TXDescription: Excellent condition Lenovo ThinkPad T480s. Cleaned and tested. Comes with genuine 65W USB-C charger. Battery holds an excellent charge (over 80% original capacity). Minor wear on the trackpad. Fast shipping!",
        analysis_output: {
          metadata: {
            platform: "ebay",
            url: "https://www.ebay.com/itm/demo-thinkpad-t480s",
            scrapedAt: new Date().toISOString(),
            searchQuery: "?q=thinkpad+t480s"
          },
          extracted_data: {
            title: "Lenovo ThinkPad T480s 14\" FHD i7-8650U 16GB 512GB NVMe SSD Windows 11 Pro",
            price: "$249.99",
            numericPrice: 249.99,
            currency: "$",
            imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=150&auto=format&fit=crop&q=60",
            condition: "Used - Very Good",
            location: "Austin, TX",
            shippingCost: "$15.00 Standard Shipping",
            sellerName: "thinkpad_refurbs",
            sellerRating: "99.8%",
            stockStatus: "1 available",
            bidsCount: "",
            extraData: "{\"processor\": \"Intel Core i7 8th Gen\", \"ram\": \"16GB\", \"storage\": \"512GB NVMe\"}"
          },
          analysis: "This ThinkPad T480s appears to be in very good condition with a healthy battery (>80%) and includes an OEM charger. The i7 processor and 16GB RAM make it a solid daily driver at this price point. Minor trackpad wear is standard for this model."
        }
      },
      {
        id: "demo-laptop-2",
        
        full_listing_text: "Apple MacBook Pro 16\" (2021) - M1 Pro - 16GB RAM - 512GB SSD - Space GrayCondition: Open BoxPrice: $1,450.00Shipping: Free ShippingSeller: tech_exchange_hub (100% positive)Location: Seattle, WADescription: Like new condition. Box was opened but the laptop was barely used. Battery cycle count is only 12. No scratches or dents. Comes with original box and accessories. AppleCare+ eligible until next month.",
        analysis_output: {
          metadata: {
            platform: "ebay",
            url: "https://www.ebay.com/itm/demo-macbook-pro-16",
            scrapedAt: new Date().toISOString(),
            searchQuery: "?q=macbook+pro+16+m1"
          },
          extracted_data: {
            title: "Apple MacBook Pro 16\" (2021) - M1 Pro - 16GB RAM - 512GB SSD - Space Gray",
            price: "$1,450.00",
            numericPrice: 1450.0,
            currency: "$",
            imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=150&auto=format&fit=crop&q=60",
            condition: "Open Box",
            location: "Seattle, WA",
            shippingCost: "Free Shipping",
            sellerName: "tech_exchange_hub",
            sellerRating: "100%",
            stockStatus: "1 available",
            bidsCount: "",
            extraData: "{\"battery_cycles\": \"12\", \"warranty\": \"AppleCare eligible\"}"
          },
          analysis: "Excellent deal for an M1 Pro 16-inch. The extremely low battery cycle count (12) corroborates the 'Open Box' claim. Factor in the free shipping and this is a premium find."
        }
      }
    ]);
  };



  const appendLogs = (newLogs: ScrapingLog[]) => {
    setLogs(prev => [...prev, ...newLogs]);
  };

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.title || '').toLowerCase().includes(q) ||
        (item.seller_name || '').toLowerCase().includes(q) ||
        (item.full_listing_text || '').toLowerCase().includes(q)
      );
    }

    if (selectedPlatform !== 'all') {
      result = result.filter(item => item.platform === selectedPlatform);
    }

    if (selectedCondition !== 'all') {
      result = result.filter(item => {
        const cond = (item.condition_label || '').toLowerCase();
        if (selectedCondition === 'new') return cond.includes('new') && !cond.includes('used');
        if (selectedCondition === 'used') return cond.includes('used') || cond.includes('pre-owned') || cond.includes('refurb');
        if (selectedCondition === 'parts') return cond.includes('parts') || cond.includes('broken');
        return true;
      });
    }

    if (minPrice !== '') {
      result = result.filter(item => (item.numericPrice || 0) >= parseFloat(minPrice));
    }
    
    if (maxPrice !== '') {
      result = result.filter(item => {
        const price = item.numericPrice;
        if (price === null) return true;
        return price <= parseFloat(maxPrice);
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'price_asc') return (a.numericPrice || 0) - (b.numericPrice || 0);
      if (sortBy === 'price_desc') return (b.numericPrice || 0) - (a.numericPrice || 0);
      if (sortBy === 'date_desc') return new Date(b.scraped_at || 0).getTime() - new Date(a.scraped_at || 0).getTime();
      return 0;
    });

    return result;
  }, [items, searchQuery, selectedPlatform, selectedCondition, minPrice, maxPrice, sortBy]);

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ScrapedItem = {
      id: `manual-${Date.now()}`,
      platform: (manualItemForm as any).platform || 'other',
      listing_id: `manual-${Date.now()}`,
      url: (manualItemForm as any).url || '',
      title: (manualItemForm as any).title || '',
      price_aud: (manualItemForm as any).price || '',
      seller_name: '',
      seller_rating: '',
      condition_code: '',
      condition_label: (manualItemForm as any).condition || '',
      shipping_type: '',
      pickup_location_text: (manualItemForm as any).location || '',
      category_path: '',
      full_listing_text: (manualItemForm as any).title || '',
      scraped_at: new Date().toISOString(),
      gpu_name: null,
      vram_capacity: null,
      cpu_name: null,
      total_system_ram: null,
      storage: null,
      egpu_model: null,
      touchscreen_digitizer: null,
      exact_model_name: null,
      numericPrice: (manualItemForm as any).price ? parseFloat(((manualItemForm as any).price).replace(/[^\d.]/g, '')) : null
    };

    setItems(prev => [newItem, ...prev]);
    setShowAddManualForm(false);
    setManualItemForm({ title: "", price: "", condition: "", location: "", platform: "other", url: "" });
  };
  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url && !manualHtml) return;

    setIsScraping(true);
    setLogs([]);
    appendLogs([
      { timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Initializing polite scraping engine...' }
    ]);
    
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          platform,
          manualHtml: showManualPaste ? manualHtml : undefined,
          delayMs,
          engine
        })
      });
      const data = await response.json();
      
      if (data.logs) {
        appendLogs(data.logs);
      }

      if (data.success && data.items) {
        setItems(prev => {
          const uniqueNew = data.items.filter((newItem: ScrapedItem) => !prev.some(existing => existing.id === newItem.id));
          return [...uniqueNew, ...prev];
        });
        
        if (!showManualPaste) setUrl("");
        setManualHtml("");
      } else {
        appendLogs([
          { timestamp: new Date().toLocaleTimeString(), level: 'error', message: data.error || 'Extraction returned empty payload.' }
        ]);
      }
    } catch (err: any) {
      appendLogs([
        { timestamp: new Date().toLocaleTimeString(), level: 'error', message: err.message || 'Scraping process crashed.' }
      ]);
    } finally {
      setIsScraping(false);
    }
  };

  const handleEditClick = (item: ScrapedItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSaveEdit = (overrideId?: string) => {
    const targetId = overrideId || editingId;
    if (!targetId) return;
    setItems(prev => prev.map(item => item.id === targetId ? { ...item, ...editForm } as ScrapedItem : item));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const exportToCSV = () => {
    const itemsToExport = selectedIds.size > 0 ? filteredItems.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) return;
    
    const headers = ["Title", "Price", "Numeric Price", "Currency", "Condition", "Location", "Shipping", "Seller", "Rating", "Stock", "Bids", "Marketplace", "URL", "Extra", "Scraped At"];
    const rows = itemsToExport.map(item => [
      `"${(item.title || "").replace(/"/g, '""')}"`,
      `"${(item.price_aud || "").replace(/"/g, '""')}"`,
      item.numericPrice || "",
      `"AUD"`,
      `"${(item.condition_label || "Unknown").replace(/"/g, '""')}"`,
      `"${(item.pickup_location_text || "N/A").replace(/"/g, '""')}"`,
      `"${(item.shipping_type || "").replace(/"/g, '""')}"`,
      `"${(item.seller_name || "").replace(/"/g, '""')}"`,
      `"${(item.seller_rating || "").replace(/"/g, '""')}"`,
      `"${(item.gpu_name || "").replace(/"/g, '""')}"`,
      `"${(item.cpu_name || "").replace(/"/g, '""')}"`,
      `"${(item.platform || "UNKNOWN").toUpperCase()}"`,
      `"${item.url}"`,
      `"${(item.full_listing_text || "").replace(/"/g, '""')}"`,
      `"${item.scraped_at}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `marketplace_research_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const itemsToExport = selectedIds.size > 0 ? filteredItems.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itemsToExport, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `marketplace_research_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCSVToClipboard = () => {
    const itemsToExport = selectedIds.size > 0 ? filteredItems.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) return;
    
    const headers = ["Title", "Price", "Numeric Price", "Currency", "Condition", "Location", "Shipping", "Seller", "Rating", "Stock", "Bids", "Marketplace", "URL", "Extra", "Scraped At"];
    const rows = itemsToExport.map(item => [
      `"${(item.title || "").replace(/"/g, '""')}"`,
      `"${(item.price_aud || "").replace(/"/g, '""')}"`,
      item.numericPrice || "",
      `"AUD"`,
      `"${(item.condition_label || "Unknown").replace(/"/g, '""')}"`,
      `"${(item.pickup_location_text || "N/A").replace(/"/g, '""')}"`,
      `"${(item.shipping_type || "").replace(/"/g, '""')}"`,
      `"${(item.seller_name || "").replace(/"/g, '""')}"`,
      `"${(item.seller_rating || "").replace(/"/g, '""')}"`,
      `"${(item.gpu_name || "").replace(/"/g, '""')}"`,
      `"${(item.cpu_name || "").replace(/"/g, '""')}"`,
      `"${(item.platform || "UNKNOWN").toUpperCase()}"`,
      `"${item.url}"`,
      `"${(item.full_listing_text || "").replace(/"/g, '""')}"`,
      `"${item.scraped_at}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    navigator.clipboard.writeText(csvContent);
    appendLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'CSV copied to clipboard' }]);
  };

  const copyToClipboard = () => {
    const itemsToExport = selectedIds.size > 0 ? filteredItems.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(itemsToExport, null, 2));
    appendLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'Dataset copied to clipboard' }]);
  };

  const stats = useMemo(() => {
    const validPrices = filteredItems.map(item => item.numericPrice).filter((p): p is number => p !== null && p > 0);
    const sum = validPrices.reduce((a, b) => a + b, 0);
    const platforms = new Set(filteredItems.map(item => item.platform)).size;
    
    return {
      total: filteredItems.length,
      average: validPrices.length > 0 ? sum / validPrices.length : 0,
      min: validPrices.length > 0 ? Math.min(...validPrices) : 0,
      max: validPrices.length > 0 ? Math.max(...validPrices) : 0,
      platforms
    };
  }, [filteredItems]);

  const priceHistogram = useMemo(() => {
    if (stats.max === 0) return [];
    const bins = 6;
    const range = stats.max === stats.min ? 100 : stats.max - stats.min; // Avoid zero step
    const step = range / bins;
    
    const histogram = Array.from({ length: bins }).map((_, i) => ({
      min: stats.min + (i * step),
      max: stats.min + ((i + 1) * step),
      count: 0
    }));

    filteredItems.forEach(item => {
      const price = item.numericPrice;
      if (price === null || price === 0) return;
      let placed = false;
      for (let i = 0; i < bins; i++) {
        if (price >= histogram[i].min && price <= histogram[i].max) {
          histogram[i].count++;
          placed = true;
          break;
        }
      }
      if (!placed && price > 0) {
         histogram[bins-1].count++;
      }
    });
    
    return histogram;
  }, [filteredItems, stats]);
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0A0A0A] text-[#E4E3E0] font-sans overflow-hidden">
      <header className="h-16 border-b border-[#262626] flex items-center justify-between px-4 sm:px-8 bg-[#0D0D0D] sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[#E4E3E0] p-2 rounded-sm text-[#0A0A0A]">
              <Database size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-serif italic text-2xl tracking-tight text-[#E4E3E0] flex items-center gap-2">
                MarketLens
                <span className="px-2 py-1 bg-[#1A1A1A] border border-[#333] rounded text-[10px] tracking-widest text-[#888] font-mono">
                  BETA V0.1
                </span>
              </h1>
              <p className="text-xs text-[#888] font-mono">GENTLE SCAN ACTIVE</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDemoData}
              className="px-3 py-1.5 text-xs bg-[#141414] hover:bg-[#1A1A1A] text-[#E4E3E0] border border-[#333] hover:border-[#444] rounded-sm flex items-center gap-1.5 transition duration-150"
            >
              <RefreshCw size={14} /> Load Demo
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6 flex flex-col overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
          
          {/* Left Column: Scraper Controls */}
          <div className="w-full lg:w-[380px] flex flex-col gap-6 overflow-y-auto shrink-0 pb-12">
            <div className="bg-[#0D0D0D] rounded-sm border border-[#262626] p-5 shadow-none space-y-4">
              <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
                <Settings size={16} className="text-[#888]" />
                <h2 className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Scraper Config</h2>
              </div>
              
              <form onSubmit={handleScrape} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#888]">Target Source URL</label>
                    <button 
                      type="button" 
                      onClick={() => setShowManualPaste(!showManualPaste)}
                      className="text-[10px] text-[#E4E3E0] hover:underline"
                    >
                      {showManualPaste ? "Switch to URL" : "Paste Manual HTML?"}
                    </button>
                  </div>
                  
                  {showManualPaste ? (
                    <textarea
                      placeholder="Paste raw HTML source here..."
                      value={manualHtml}
                      onChange={(e) => setManualHtml(e.target.value)}
                      className="w-full h-32 bg-[#141414] text-xs font-mono border border-[#262626] focus:border-[#E4E3E0] focus:ring-1 focus:ring-[#444] rounded-sm px-3 py-2 outline-none transition resize-none text-[#CCC]"
                    />
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-[#555]" />
                      </div>
                      <input
                        type="url"
                        placeholder="https://www.ebay.com/sch/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-[#141414] text-xs font-mono border border-[#262626] focus:border-[#E4E3E0] focus:ring-1 focus:ring-[#444] rounded-sm pl-9 pr-3 py-2 outline-none transition text-[#CCC]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1.5">Marketplace Target</label>
                  <select
                    value={platform}
                    onChange={(e: any) => setPlatform(e.target.value)}
                    className="w-full bg-[#141414] text-xs font-mono border border-[#262626] focus:border-[#E4E3E0] focus:ring-1 focus:ring-[#444] rounded-sm px-3 py-2 outline-none transition text-[#CCC]"
                  >
                    <option value="auto">Auto-Detect Platform</option>
                    <option value="ebay">eBay</option>
                    <option value="amazon">Amazon</option>
                    <option value="gumtree">Gumtree</option>
                    <option value="facebook">Facebook Marketplace</option>
                    <option value="generic">Generic Table/List</option>
                    <option value="other">Other/General Webpage</option>
                  </select>
                </div>
                <div className="pt-2 border-t border-[#262626]">
                  <label className="block text-xs font-medium text-[#888] mb-1.5">Extraction Engine</label>
                  <select
                    value={engine}
                    onChange={(e: any) => setEngine(e.target.value)}
                    className="w-full bg-[#141414] text-xs font-mono border border-[#262626] focus:border-[#E4E3E0] focus:ring-1 focus:ring-[#444] rounded-sm px-3 py-2 outline-none transition text-[#CCC]"
                  >
                    <option value="infatica">Deep E-commerce API (Infatica-style)</option>
                    <option value="instant">Heuristic Table Extractor (Instant Data-style)</option>
                  </select>
                </div>

                {/* Delay & Polite Crawling Settings */}
                <div className="pt-2 border-t border-[#262626]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#888] flex items-center gap-1">
                      <Clock size={14} className="text-[#888]" /> Politely Throttle Delay
                    </span>
                    <span className="text-xs font-mono text-[#E4E3E0] font-semibold">{delayMs / 1000}s pause</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="8000"
                    step="500"
                    value={delayMs}
                    onChange={(e) => setDelayMs(parseInt(e.target.value))}
                    className="w-full accent-[#E4E3E0] h-1.5 bg-[#141414] rounded-sm appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-[#555] mt-1">
                    Inserts a gentle timeout wait before compiling to safeguard server IP from aggressive crawler blocking.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isScraping || (!url && !manualHtml)}
                  className="w-full mt-2 bg-[#E4E3E0] hover:bg-white text-[#0A0A0A] font-bold py-3 px-4 rounded-sm text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition duration-150 shadow-none shadow-none disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Scraping & Extracting...
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      Run Scrape Batch
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Scraper Live Log Console */}
            <div className="bg-[#0D0D0D] rounded-sm border border-[#262626] overflow-hidden shadow-none">
              <div className="border-b border-[#262626] bg-[#141414] px-4 py-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isScraping ? 'bg-[#E4E3E0]' : 'bg-[#555]'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isScraping ? 'bg-[#E4E3E0]' : 'bg-[#444]'}`}></span>
                  </span>
                  Gentle Crawler Status Log
                </span>
                <button 
                  onClick={() => setLogs([])}
                  disabled={logs.length === 0}
                  className="text-[10px] text-[#555] hover:text-[#CCC] disabled:opacity-40"
                >
                  Clear Console
                </button>
              </div>
              <div className="p-4 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto space-y-2 bg-[#0D0D0D] text-[#888]">
                {logs.length === 0 ? (
                  <div className="text-[#444] italic text-center py-6">
                    Waiting to initiate research run. Enter a URL above or load sample data to explore logs.
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-[#444] shrink-0">[{log.timestamp}]</span>
                      <span className={`font-semibold shrink-0 ${
                        log.level === 'success' ? 'text-[#E4E3E0]' :
                        log.level === 'error' ? 'text-[#E4E3E0]' :
                        log.level === 'warning' ? 'text-[#E4E3E0]' :
                        'text-[#E4E3E0]'
                      }`}>
                        {log.level.toUpperCase()}:
                      </span>
                      <span className="text-[#CCC] break-words">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-[#0D0D0D] rounded-sm border border-[#262626] p-4">
              <h3 className="text-xs font-semibold text-[#CCC] flex items-center gap-1.5 mb-2">
                <Info size={14} className="text-[#E4E3E0]" />
                Researcher Hand Book
              </h3>
              <ul className="text-xs text-[#888] space-y-1.5 list-disc pl-4 leading-normal">
                <li>Search URLs containing item listings yield the most successful structural datasets.</li>
                <li>Amazon and Facebook employ strict cloud firewalls. Use the <strong>Manual HTML Paste</strong> tab for bulletproof extraction on these services.</li>
                <li>You can manually refine any extracted item parameters directly inside the list grid by clicking the pencil <Edit3 size={12} className="inline"/> edit button on each row.</li>
              </ul>
            </div>

          </div>

          {/* Right panel: Data exploration workspace */}
          <section className="lg:col-span-8 space-y-6">

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0D0D0D] p-4 rounded-sm border border-[#262626] shadow-none">
                <p className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Total Listings</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-mono text-[#E4E3E0]">{stats.total}</span>
                  <span className="text-[10px] bg-[#1A1A1A] border border-[#333] text-[#E4E3E0] px-1.5 py-0.5 rounded font-mono font-medium">unified</span>
                </div>
              </div>
              <div className="bg-[#0D0D0D] p-4 rounded-sm border border-[#262626] shadow-none">
                <p className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Average Price</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-mono text-[#E4E3E0]">
                    {stats.average > 0 ? `$${stats.average.toFixed(2)}` : 'N/A'}
                  </span>
                  <span className="text-[10px] bg-[#141414] text-[#888] px-1.5 py-0.5 rounded font-mono">USD</span>
                </div>
              </div>
              <div className="bg-[#0D0D0D] p-4 rounded-sm border border-[#262626] shadow-none">
                <p className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Lowest Price</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-mono text-[#E4E3E0]">
                    {stats.min > 0 ? `$${stats.min.toFixed(2)}` : 'N/A'}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-[#E4E3E0] px-1.5 py-0.5 rounded font-mono">bargain</span>
                </div>
              </div>
              <div className="bg-[#0D0D0D] p-4 rounded-sm border border-[#262626] shadow-none">
                <p className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Unique Marketplaces</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-mono text-[#E4E3E0]">{stats.platforms}</span>
                  <span className="text-[10px] bg-sky-500/10 text-[#E4E3E0] px-1.5 py-0.5 rounded font-mono">sources</span>
                </div>
              </div>
            </div>

            {/* Filter Hub Card */}
            <div className="bg-[#0D0D0D] rounded-sm border border-[#262626] p-5 shadow-none space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#262626]">
                <h2 className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[#E4E3E0]" /> Advanced Filter Workspace
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[#888]">{filteredItems.length} of {items.length} records shown</span>
                </div>
              </div>

              {/* Text Search & Platform Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6 relative">
                  <Search size={16} className="absolute left-3 top-3 text-[#555]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, locations, query patterns..."
                    className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-[#E4E3E0] focus:ring-1 focus:ring-[#444] rounded-sm pl-10 pr-4 py-2 text-sm outline-none transition text-[#E4E3E0] placeholder:text-[#444]"
                  />
                </div>

                <div className="md:col-span-6 flex space-x-1 bg-[#0A0A0A] p-1 rounded-sm border border-[#262626]">
                  {['all', 'ebay', 'amazon', 'gumtree', 'facebook'].map((plat) => (
                    <button
                      key={plat}
                      onClick={() => setSelectedPlatform(plat)}
                      className={`flex-1 py-1 text-xs rounded transition uppercase font-semibold ${
                        selectedPlatform === plat 
                          ? 'bg-[#141414] text-[#E4E3E0] shadow-none' 
                          : 'text-[#555] hover:text-[#CCC]'
                      }`}
                    >
                      {plat === 'all' ? 'All' : plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                {/* Min Price */}
                <div>
                  <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Min Price ($)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-[#E4E3E0] rounded-sm px-3 py-1.5 text-xs text-[#E4E3E0] outline-none"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Max Price ($)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-[#E4E3E0] rounded-sm px-3 py-1.5 text-xs text-[#E4E3E0] outline-none"
                  />
                </div>

                {/* Condition filter */}
                <div>
                  <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Condition</label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-[#E4E3E0] rounded-sm px-2 py-1.5 text-xs text-[#CCC] outline-none"
                  >
                    <option value="all">Any Condition</option>
                    <option value="new">New / Mint</option>
                    <option value="used">Used / Pre-owned</option>
                    <option value="tested">Tested / Good</option>
                    <option value="parts">For Parts / Untested</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-[#E4E3E0] rounded-sm px-2 py-1.5 text-xs text-[#CCC] outline-none"
                  >
                    <option value="scraped-new">Date Added (Newest)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="title-asc">Title (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Price Distribution Visualizer */}
            {filteredItems.length > 0 && priceHistogram.length > 0 && (
              <div className="bg-[#0D0D0D] rounded-sm border border-[#262626] p-5 shadow-none">
                <h3 className="text-xs font-semibold text-[#E4E3E0] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ListFilter size={14} className="text-[#E4E3E0]" /> Price Distribution spread (Active view)
                </h3>
                <div className="flex items-end justify-between gap-4 h-24 pt-4 border-b border-[#262626]">
                  {priceHistogram.map((bucket, idx) => {
                    const maxCount = Math.max(...priceHistogram.map(b => b.count));
                    const percentage = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full group relative">
                        {/* Bar */}
                        <div className="w-full bg-[#141414] rounded-t-md relative h-full flex items-end overflow-hidden">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${percentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-full bg-[#E4E3E0] hover:bg-white transition-colors"
                          />
                        </div>
                        {/* Tooltip */}
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 bg-[#141414] text-[10px] text-[#E4E3E0] px-1.5 py-0.5 rounded font-mono border border-[#333] pointer-events-none transition duration-150 shadow-none">
                          {bucket.count} items
                        </div>
                        {/* Axis Label */}
                        <span className="text-[9px] text-[#555] mt-2 font-mono whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                          {bucket.range}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Unified Data Table Panel */}
            <div className="bg-[#0D0D0D] rounded-sm border border-[#262626] shadow-none overflow-hidden">
              <div className="border-b border-[#262626] bg-[#141414] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Layers size={18} className="text-[#E4E3E0]" />
                  <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Scraped Listings Dataset</span>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={() => setShowAddManualForm(true)}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0A] border border-[#262626] hover:bg-[#141414] text-[#E4E3E0] rounded flex items-center gap-1 transition"
                  >
                    <Plus size={12} /> Add Row
                  </button>
                  <button
                    onClick={exportToCSV}
                    disabled={filteredItems.length === 0}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0A] border border-[#262626] hover:bg-[#141414] text-[#E4E3E0] rounded flex items-center gap-1 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Download size={12} /> {selectedIds.size > 0 ? `Download CSV (${selectedIds.size})` : "Download CSV"}
                  </button>
                  <button
                    onClick={exportToJSON}
                    disabled={filteredItems.length === 0}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0A] border border-[#262626] hover:bg-[#141414] text-[#E4E3E0] rounded flex items-center gap-1 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Download size={12} /> {selectedIds.size > 0 ? `Download JSON (${selectedIds.size})` : "Download JSON"}
                  </button>
                                    <button
                    onClick={copyCSVToClipboard}
                    disabled={filteredItems.length === 0}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0A] border border-[#262626] hover:bg-[#141414] text-[#E4E3E0] rounded flex items-center gap-1 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Clipboard size={12} /> {selectedIds.size > 0 ? `Copy CSV (${selectedIds.size})` : "Copy CSV"}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    disabled={filteredItems.length === 0}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0A] border border-[#262626] hover:bg-[#141414] text-[#E4E3E0] rounded flex items-center gap-1 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Clipboard size={12} /> {selectedIds.size > 0 ? `Copy JSON (${selectedIds.size})` : "Copy JSON"}
                  </button>
                </div>
              </div>

              {/* Add Custom Row Inline Modal/Form */}
              <AnimatePresence>
                {showAddManualForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-[#0A0A0A] border-b border-[#262626] overflow-hidden"
                  >
                    <form onSubmit={handleAddManualItem} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#E4E3E0]">Add Manual Listing Record</span>
                        <button type="button" onClick={() => setShowAddManualForm(false)} className="text-[#888] hover:text-[#E4E3E0]">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Listing Title (e.g. Sony DSLR Body)"
                          value={manualItemForm.title}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none col-span-1 md:col-span-2"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Price Display (e.g. $220.00)"
                          value={manualItemForm.price}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, price_aud: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Condition (e.g. Vintage Excellent)"
                          value={manualItemForm.condition}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, condition: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Location (e.g. San Jose, CA)"
                          value={manualItemForm.location}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, pickup_location_text: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <select
                          value={manualItemForm.platform}
                          onChange={(e: any) => setManualItemForm(prev => ({ ...prev, platform: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#CCC] outline-none"
                        >
                          <option value="ebay">eBay</option>
                          <option value="amazon">Amazon</option>
                          <option value="gumtree">Gumtree</option>
                          <option value="facebook">Facebook Marketplace</option>
                          <option value="other">Other</option>
                        </select>
                        <input
                          type="url"
                          placeholder="Direct Listing URL (Optional)"
                          value={manualItemForm.url}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, url: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none col-span-1 md:col-span-2"
                        />
                        <input
                          type="url"
                          placeholder="Image URL (Optional)"
                          value={manualItemForm.imageUrl}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button type="submit" className="px-4 py-1.5 bg-[#E4E3E0] hover:bg-white text-[#0A0A0A] font-bold text-xs rounded shadow-none">
                          Save New Record
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Listings Data Grid Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  
                  <thead>
                    <tr className="border-b border-[#262626] text-[#555] text-[10px] font-bold uppercase tracking-widest font-mono bg-[#141414]">
                      <th className="py-3 px-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(new Set(filteredItems.map(i => i.id)));
                            } else {
                              setSelectedIds(new Set());
                            }
                          }}
                          className="accent-[#E4E3E0] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Item Title</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>

                  
                  <tbody className="divide-y divide-[#262626]">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#555] text-xs italic">
                          No matching records found in this workspace view.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isEditing = editingId === item.id;
                        let platBadgeClass = "text-[#888]";
                        if (item.platform === 'ebay') platBadgeClass = "text-[#6A9955]";
                        else if (item.platform === 'amazon') platBadgeClass = "text-[#E46B6B]";
                        else if (item.platform === 'gumtree') platBadgeClass = "text-[#9B6BE4]";
                        else if (item.platform === 'facebook') platBadgeClass = "text-[#4A90E2]";
                        
                        return (
                          <tr 
                            key={item.id} 
                            onDoubleClick={() => !isEditing && handleEditClick(item)}
                            className="text-xs hover:bg-[#111] group transition border-b border-[#1A1A1A] items-center"
                          >
                            <td className="py-3 px-4 w-10">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedIds);
                                  if (e.target.checked) newSet.add(item.id);
                                  else newSet.delete(item.id);
                                  setSelectedIds(newSet);
                                }}
                                className="accent-[#E4E3E0] cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold">
                              <span className={platBadgeClass}>
                                {item.platform === 'facebook' ? 'FB Mkt' : (item.platform ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1) : 'Unknown')}
                              </span>
                            </td>
                            <td className="py-3 px-4 max-w-sm">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.title}
                                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                  className="w-full bg-[#0D0D0D] text-xs border border-[#444] rounded p-1.5 outline-none text-[#E4E3E0]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                />
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-[#CCC] truncate">
                                    {item.title}
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#555] font-mono mt-1">
                                    {item.condition_label && <span>COND: {item.condition_label}</span>}
                                    {item.seller_name && <span className="text-[#777]">SELLER: {item.seller_name} {item.seller_rating && `(${item.seller_rating})`}</span>}
                                    {item.shipping_type && <span>SHIP: {item.shipping_type}</span>}
                                    {item.gpu_name && <span>STOCK: {item.gpu_name}</span>}
                                    {item.cpu_name && <span>BIDS: {item.cpu_name}</span>}
                                    {item.full_listing_text && <span className="text-[#888] truncate block max-w-full">EXTRA: {item.full_listing_text}</span>}
                                  </div>
                                  {item.url && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#888] hover:text-[#E4E3E0] inline-flex items-center gap-1">
                                      Visit Original <ExternalLink size={10} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.price_aud}
                                  onChange={(e) => setEditForm({ ...editForm, price_aud: e.target.value })}
                                  className="w-20 bg-[#0D0D0D] text-xs text-right border border-[#444] rounded p-1 outline-none text-[#E4E3E0]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                />
                              ) : (
                                <span>{item.price_aud}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#777]">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.pickup_location_text}
                                  onChange={(e) => setEditForm({ ...editForm, pickup_location_text: e.target.value })}
                                  className="w-24 bg-[#0D0D0D] text-xs border border-[#444] rounded p-1 outline-none text-[#CCC]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                />
                              ) : (
                                <span className="truncate max-w-[120px] block" title={item.pickup_location_text}>{item.pickup_location_text || "N/A"}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition">
                                {isEditing ? (
                                  <button onClick={() => handleSaveEdit()} className="p-1 text-[#E4E3E0] hover:text-white transition">
                                    <Check size={14} />
                                  </button>
                                ) : (
                                  <button onClick={() => handleEditClick(item)} className="p-1 text-[#555] hover:text-[#E4E3E0] transition">
                                    <Edit2 size={14} />
                                  </button>
                                )}
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-[#555] hover:text-red-400 transition">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>

                </table>
              </div>
            </div>

          </section>

        </div>
      </main>

      {/* Persistent Footer */}
      
      {/* Footer Metrics */}
      <footer className="mt-4 h-8 flex items-center justify-between px-8 text-[10px] font-mono text-[#444] border-t border-[#262626] bg-[#0A0A0A]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)] ${isScraping ? 'bg-orange-500' : 'bg-gray-600'}`}></div>
            <span>SCRAPER_ENGINE: {isScraping ? 'ACTIVE' : 'IDLE'}</span>
          </div>
          <div>DATA_INTEGRITY: OPTIMAL</div>
          <div>CACHE_USAGE: 14%</div>
        </div>
      </footer>

    </div>
  );
}
