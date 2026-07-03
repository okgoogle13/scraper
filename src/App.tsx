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
  const [manualHtml, setManualHtml] = useState("");
  const [delayMs, setDelayMs] = useState<number>(1500);
  const [isScraping, setIsScraping] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "scraped-new" | "title-asc">("scraped-new");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showAddManualForm, setShowAddManualForm] = useState(false);
  
  const [manualItemForm, setManualItemForm] = useState<Partial<ScrapedItem>>({
    title: "",
    price_aud: 0,
    condition_label: "Brand New",
    pickup_location_text: "",
    url: "",
    gpu_name: "",
    vram_capacity: 0,
    cpu_name: "",
    total_system_ram: 0,
    storage: "",
    exact_model_name: "",
    seller_name: "",
    seller_rating: 100
  });

  const loadDemoData = () => {
    const demoItems: ScrapedItem[] = [
      {
        id: "demo-ebay-1",
        platform: "EBAY_AU",
        listing_id: "325123456789",
        url: "https://www.ebay.com.au/itm/325123456789",
        title: "MSI Titan 18 HX - RTX 4090 - 128GB RAM - 4TB SSD",
        price_aud: 6500.00,
        seller_name: "tech_store_melbourne",
        seller_rating: 99.5,
        condition_code: "1000",
        condition_label: "Brand New",
        shipping_type: "Free Standard Postage",
        pickup_location_text: "Northcote, Victoria, Australia",
        category_path: "Computers/Tablets & Networking > Laptops & Netbooks > PC Laptops & Netbooks",
        full_listing_text: "Up for sale is a brand new MSI Titan 18 HX featuring the top-tier RTX 4090 with 16GB VRAM. Perfect for local AI inference and heavy multitasking. Comes with 128GB system RAM and 4TB NVMe storage.",
        scraped_at: new Date().toISOString(),
        gpu_name: "NVIDIA GeForce RTX 4090 Laptop GPU",
        vram_capacity: 16,
        cpu_name: "Intel Core i9-14900HX",
        total_system_ram: 128,
        storage: "4TB NVMe SSD",
        egpu_model: null,
        touchscreen_digitizer: false,
        exact_model_name: "MSI Titan 18 HX",
        numericPrice: 6500.00
      },
      {
        id: "demo-ebay-2",
        platform: "EBAY_AU",
        listing_id: "145678901234",
        url: "https://www.ebay.com.au/itm/145678901234",
        title: "Lenovo ThinkPad T14 Gen 3 AMD Ryzen 7 PRO 6850U 32GB RAM 1TB SSD",
        price_aud: 1250.00,
        seller_name: "oz_refurb_kings",
        seller_rating: 98.9,
        condition_code: "3000",
        condition_label: "Excellent - Refurbished",
        shipping_type: "Standard Postage $15.00",
        pickup_location_text: "Sydney, New South Wales, Australia",
        category_path: "Computers/Tablets & Networking > Laptops & Netbooks > PC Laptops & Netbooks",
        full_listing_text: "Refurbished Lenovo ThinkPad T14 Gen 3. Equipped with a super-efficient Ryzen 7 PRO processor, 32GB LPDDR5 system RAM, and 1TB NVMe SSD. Crisp WUXGA display. Minimal wear, fully tested.",
        scraped_at: new Date().toISOString(),
        gpu_name: "AMD Radeon 680M Graphics",
        vram_capacity: null,
        cpu_name: "AMD Ryzen 7 PRO 6850U",
        total_system_ram: 32,
        storage: "1TB NVMe SSD",
        egpu_model: null,
        touchscreen_digitizer: false,
        exact_model_name: "ThinkPad T14 Gen 3 AMD",
        numericPrice: 1250.00
      },
      {
        id: "demo-ebay-3",
        platform: "EBAY_AU",
        listing_id: "278945612301",
        url: "https://www.ebay.com.au/itm/278945612301",
        title: "Razer Blade 16 (2024) QHD+ 240Hz OLED i9-14900HX RTX 4080 32GB RAM",
        price_aud: 4399.00,
        seller_name: "syndicate_games",
        seller_rating: 100.0,
        condition_code: "1500",
        condition_label: "Open Box - Like New",
        shipping_type: "Free Express Postage",
        pickup_location_text: "Brisbane, Queensland, Australia",
        category_path: "Computers/Tablets & Networking > Laptops & Netbooks > PC Laptops & Netbooks",
        full_listing_text: "Virtually brand new Razer Blade 16. Features the 240Hz OLED panel, RTX 4080 Laptop GPU, and Core i9 14th gen processor. Absolutely beautiful screen, original premium packaging included.",
        scraped_at: new Date().toISOString(),
        gpu_name: "NVIDIA GeForce RTX 4080 Laptop GPU",
        vram_capacity: 12,
        cpu_name: "Intel Core i9-14900HX",
        total_system_ram: 32,
        storage: "1TB PCIe Gen4 SSD",
        egpu_model: null,
        touchscreen_digitizer: false,
        exact_model_name: "Razer Blade 16",
        numericPrice: 4399.00
      }
    ];
    setItems(demoItems);
    appendLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'Demo dataset loaded to workspace' }]);
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
        (item.gpu_name || '').toLowerCase().includes(q) ||
        (item.cpu_name || '').toLowerCase().includes(q) ||
        (item.exact_model_name || '').toLowerCase().includes(q) ||
        (item.full_listing_text || '').toLowerCase().includes(q)
      );
    }

    if (selectedCondition !== 'all') {
      result = result.filter(item => {
        const cond = (item.condition_label || '').toLowerCase();
        if (selectedCondition === 'new') return cond.includes('new') || cond.includes('sealed') || cond.includes('brand');
        if (selectedCondition === 'used') return cond.includes('used') || cond.includes('pre-owned') || cond.includes('refurb') || cond.includes('excellent');
        if (selectedCondition === 'parts') return cond.includes('parts') || cond.includes('broken') || cond.includes('untested');
        return true;
      });
    }

    if (minPrice !== '') {
      result = result.filter(item => (item.price_aud || 0) >= parseFloat(minPrice));
    }
    
    if (maxPrice !== '') {
      result = result.filter(item => (item.price_aud || 0) <= parseFloat(maxPrice));
    }

    result.sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price_aud || 0) - (b.price_aud || 0);
      if (sortBy === 'price-desc') return (b.price_aud || 0) - (a.price_aud || 0);
      if (sortBy === 'title-asc') return (a.title || "").localeCompare(b.title || "");
      if (sortBy === 'scraped-new') return new Date(b.scraped_at || 0).getTime() - new Date(a.scraped_at || 0).getTime();
      return 0;
    });

    return result;
  }, [items, searchQuery, selectedCondition, minPrice, maxPrice, sortBy]);

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = Date.now();
    const cleanPrice = parseFloat(String(manualItemForm.price_aud || 0).replace(/[^\d.]/g, '')) || 0;
    
    const newItem: ScrapedItem = {
      id: `manual-${timestamp}`,
      platform: "EBAY_AU",
      listing_id: manualItemForm.listing_id || String(timestamp),
      url: manualItemForm.url || 'https://www.ebay.com.au',
      title: manualItemForm.title || 'Untitled Manual Record',
      price_aud: cleanPrice,
      seller_name: manualItemForm.seller_name || 'Manual Seller',
      seller_rating: manualItemForm.seller_rating !== undefined ? parseFloat(String(manualItemForm.seller_rating)) : 100,
      condition_code: '1000',
      condition_label: manualItemForm.condition_label || 'Brand New',
      shipping_type: 'Free Postage',
      pickup_location_text: manualItemForm.pickup_location_text || 'Australia',
      category_path: 'Computers/Tablets & Networking > Laptops & Netbooks',
      full_listing_text: manualItemForm.full_listing_text || manualItemForm.title || '',
      scraped_at: new Date().toISOString(),
      gpu_name: manualItemForm.gpu_name || null,
      vram_capacity: manualItemForm.vram_capacity ? parseInt(String(manualItemForm.vram_capacity)) : null,
      cpu_name: manualItemForm.cpu_name || null,
      total_system_ram: manualItemForm.total_system_ram ? parseInt(String(manualItemForm.total_system_ram)) : null,
      storage: manualItemForm.storage || null,
      egpu_model: null,
      touchscreen_digitizer: false,
      exact_model_name: manualItemForm.exact_model_name || null,
      numericPrice: cleanPrice
    };

    setItems(prev => [newItem, ...prev]);
    setShowAddManualForm(false);
    setManualItemForm({
      title: "",
      price_aud: 0,
      condition_label: "Brand New",
      pickup_location_text: "",
      url: "",
      gpu_name: "",
      vram_capacity: 0,
      cpu_name: "",
      total_system_ram: 0,
      storage: "",
      exact_model_name: "",
      seller_name: "",
      seller_rating: 100
    });
    appendLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'Added manual eBay record conforming to schema' }]);
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url && !manualHtml) return;

    setIsScraping(true);
    setLogs([]);
    appendLogs([
      { timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Initializing polite scraping sequence...' }
    ]);
    
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          manualHtml: showManualPaste ? manualHtml : undefined,
          delayMs
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
    setEditForm({
      ...item,
      price_aud: String(item.price_aud)
    });
  };

  const handleSaveEdit = (overrideId?: string) => {
    const targetId = overrideId || editingId;
    if (!targetId) return;
    
    const parsedPrice = parseFloat(String(editForm.price_aud).replace(/[^\d.]/g, '')) || 0;
    const updatedForm = {
      ...editForm,
      price_aud: parsedPrice,
      numericPrice: parsedPrice,
      vram_capacity: editForm.vram_capacity ? parseInt(String(editForm.vram_capacity)) : null,
      total_system_ram: editForm.total_system_ram ? parseInt(String(editForm.total_system_ram)) : null,
    };
    
    setItems(prev => prev.map(item => item.id === targetId ? { ...item, ...updatedForm } as ScrapedItem : item));
    setEditingId(null);
    appendLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'Listing row updated' }]);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const exportToCSV = () => {
    const itemsToExport = selectedIds.size > 0 ? filteredItems.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) return;
    
    const headers = [
      "platform", "listing_id", "url", "title", "price_aud", 
      "seller_name", "seller_rating", "condition_code", "condition_label", 
      "shipping_type", "pickup_location_text", "category_path", "full_listing_text", 
      "scraped_at", "gpu_name", "vram_capacity", "cpu_name", 
      "total_system_ram", "storage", "egpu_model", "touchscreen_digitizer", "exact_model_name"
    ];

    const rows = itemsToExport.map(item => [
      `"${(item.platform || "EBAY_AU").replace(/"/g, '""')}"`,
      `"${(item.listing_id || "").replace(/"/g, '""')}"`,
      `"${(item.url || "").replace(/"/g, '""')}"`,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      item.price_aud || 0,
      `"${(item.seller_name || "").replace(/"/g, '""')}"`,
      item.seller_rating !== null ? item.seller_rating : "",
      `"${(item.condition_code || "").replace(/"/g, '""')}"`,
      `"${(item.condition_label || "").replace(/"/g, '""')}"`,
      `"${(item.shipping_type || "").replace(/"/g, '""')}"`,
      `"${(item.pickup_location_text || "").replace(/"/g, '""')}"`,
      `"${(item.category_path || "").replace(/"/g, '""')}"`,
      `"${(item.full_listing_text || "").replace(/"/g, '""')}"`,
      `"${item.scraped_at || ""}"`,
      `"${(item.gpu_name || "").replace(/"/g, '""')}"`,
      item.vram_capacity !== null ? item.vram_capacity : "",
      `"${(item.cpu_name || "").replace(/"/g, '""')}"`,
      item.total_system_ram !== null ? item.total_system_ram : "",
      `"${(item.storage || "").replace(/"/g, '""')}"`,
      `"${(item.egpu_model || "").replace(/"/g, '""')}"`,
      item.touchscreen_digitizer !== null ? (item.touchscreen_digitizer ? "TRUE" : "FALSE") : "",
      `"${(item.exact_model_name || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ebay_hardware_export_${Date.now()}.csv`);
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
    link.setAttribute("download", `ebay_hardware_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyCSVToClipboard = () => {
    const itemsToExport = selectedIds.size > 0 ? filteredItems.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) return;
    
    const headers = [
      "platform", "listing_id", "url", "title", "price_aud", 
      "seller_name", "seller_rating", "condition_code", "condition_label", 
      "shipping_type", "pickup_location_text", "category_path", "full_listing_text", 
      "scraped_at", "gpu_name", "vram_capacity", "cpu_name", 
      "total_system_ram", "storage", "egpu_model", "touchscreen_digitizer", "exact_model_name"
    ];

    const rows = itemsToExport.map(item => [
      `"${(item.platform || "EBAY_AU").replace(/"/g, '""')}"`,
      `"${(item.listing_id || "").replace(/"/g, '""')}"`,
      `"${(item.url || "").replace(/"/g, '""')}"`,
      `"${(item.title || "").replace(/"/g, '""')}"`,
      item.price_aud || 0,
      `"${(item.seller_name || "").replace(/"/g, '""')}"`,
      item.seller_rating !== null ? item.seller_rating : "",
      `"${(item.condition_code || "").replace(/"/g, '""')}"`,
      `"${(item.condition_label || "").replace(/"/g, '""')}"`,
      `"${(item.shipping_type || "").replace(/"/g, '""')}"`,
      `"${(item.pickup_location_text || "").replace(/"/g, '""')}"`,
      `"${(item.category_path || "").replace(/"/g, '""')}"`,
      `"${(item.full_listing_text || "").replace(/"/g, '""')}"`,
      `"${item.scraped_at || ""}"`,
      `"${(item.gpu_name || "").replace(/"/g, '""')}"`,
      item.vram_capacity !== null ? item.vram_capacity : "",
      `"${(item.cpu_name || "").replace(/"/g, '""')}"`,
      item.total_system_ram !== null ? item.total_system_ram : "",
      `"${(item.storage || "").replace(/"/g, '""')}"`,
      `"${(item.egpu_model || "").replace(/"/g, '""')}"`,
      item.touchscreen_digitizer !== null ? (item.touchscreen_digitizer ? "TRUE" : "FALSE") : "",
      `"${(item.exact_model_name || "").replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    navigator.clipboard.writeText(csvContent);
    appendLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'CSV dataset copied to clipboard' }]);
  };

  const copyToClipboard = () => {
    const itemsToExport = selectedIds.size > 0 ? filteredItems.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(itemsToExport, null, 2));
    appendLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'JSON dataset copied to clipboard' }]);
  };

  const stats = useMemo(() => {
    const prices = filteredItems.map(item => item.price_aud).filter(p => typeof p === 'number' && p > 0);
    const sum = prices.reduce((a, b) => a + b, 0);
    const uniqueLocations = new Set(filteredItems.map(item => item.pickup_location_text).filter(Boolean)).size;
    
    return {
      total: filteredItems.length,
      average: prices.length > 0 ? sum / prices.length : 0,
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      locations: uniqueLocations
    };
  }, [filteredItems]);

  const priceHistogram = useMemo(() => {
    if (stats.max === 0) return [];
    const bins = 6;
    const range = stats.max === stats.min ? 100 : stats.max - stats.min;
    const step = range / bins;
    
    const histogram = Array.from({ length: bins }).map((_, i) => ({
      min: stats.min + (i * step),
      max: stats.min + ((i + 1) * step),
      count: 0,
      range: `$${Math.round(stats.min + (i * step))}-$${Math.round(stats.min + ((i + 1) * step))}`
    }));

    filteredItems.forEach(item => {
      const price = item.price_aud;
      if (!price || price === 0) return;
      let placed = false;
      for (let i = 0; i < bins; i++) {
        if (price >= histogram[i].min && price <= histogram[i].max) {
          histogram[i].count++;
          placed = true;
          break;
        }
      }
      if (!placed && price > 0) {
         histogram[bins - 1].count++;
      }
    });
    
    return histogram;
  }, [filteredItems, stats]);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0A0A0A] text-[#E4E3E0] font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-[#262626] flex items-center justify-between px-4 sm:px-8 bg-[#0D0D0D] sticky top-0 z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[#E4E3E0] p-2 rounded-sm text-[#0A0A0A]">
              <Database size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-serif italic text-2xl tracking-tight text-[#E4E3E0] flex items-center gap-2">
                eBay Hardware Scout
                <span className="px-2 py-1 bg-[#1A1A1A] border border-[#333] rounded text-[10px] tracking-widest text-[#888] font-mono">
                  AU SCHEMA v1.0
                </span>
              </h1>
              <p className="text-xs text-[#888] font-mono">EBAY_AU SPECIFICATION LOADED</p>
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

      {/* Main Panel */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6 flex flex-col overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
          
          {/* Left Column: Crawler Controls */}
          <div className="w-full lg:w-[380px] flex flex-col gap-6 overflow-y-auto shrink-0 pb-12">
            <div className="bg-[#0D0D0D] rounded-sm border border-[#262626] p-5 shadow-none space-y-4">
              <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
                <Settings size={16} className="text-[#888]" />
                <h2 className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">eBay Parser Settings</h2>
              </div>
              
              <form onSubmit={handleScrape} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#888]">Target eBay URL</label>
                    <button 
                      type="button" 
                      onClick={() => setShowManualPaste(!showManualPaste)}
                      className="text-[10px] text-[#E4E3E0] hover:underline"
                    >
                      {showManualPaste ? "Switch to URL" : "Paste Watchlist HTML?"}
                    </button>
                  </div>
                  
                  {showManualPaste ? (
                    <textarea
                      placeholder="Paste raw Watchlist or Search HTML source here..."
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
                        placeholder="e.g., https://www.ebay.com.au/itm/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-[#141414] text-xs font-mono border border-[#262626] focus:border-[#E4E3E0] focus:ring-1 focus:ring-[#444] rounded-sm pl-9 pr-3 py-2 outline-none transition text-[#CCC]"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-[#555] mt-1.5 leading-normal">
                    Supports eBay item pages, search listings, and raw Watchlist layouts.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#888] mb-1">Target Platform</label>
                  <div className="w-full bg-[#141414] border border-[#262626] rounded px-3 py-2 text-xs font-mono text-[#CCC]">
                    EBAY_AU (Fixed)
                  </div>
                </div>

                {/* Delay & Polite Crawling Settings */}
                <div className="pt-2 border-t border-[#262626]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#888] flex items-center gap-1">
                      <Clock size={14} className="text-[#888]" /> Throttled Fetch Delay
                    </span>
                    <span className="text-xs font-mono text-[#E4E3E0] font-semibold">{delayMs / 1000}s</span>
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
                    Delays HTTP calls to prevent server IP throttling or client-side bans.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isScraping || (!url && !manualHtml)}
                  className="w-full mt-2 bg-[#E4E3E0] hover:bg-white text-[#0A0A0A] font-bold py-3 px-4 rounded-sm text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition duration-150 shadow-none disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Extracting Schema...
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      Scrape eBay Source
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
                  Scout Logger Console
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
                    Logger inactive. Click "Load Demo" or enter a URL to start scouting.
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
                Schema Grounding Rule
              </h3>
              <p className="text-xs text-[#888] leading-normal">
                This client operates strictly in <strong>EBAY_AU</strong> mode to populate GPU, CPU, System RAM, and Seller details mapping exactly to the custom structured JSON target structure.
              </p>
            </div>
          </div>

          {/* Right panel: Data exploration workspace */}
          <section className="flex-1 space-y-6 overflow-y-auto pb-12 pr-1">

            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0D0D0D] p-4 rounded-sm border border-[#262626] shadow-none">
                <p className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Total Listings</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-mono text-[#E4E3E0]">{stats.total}</span>
                  <span className="text-[10px] bg-[#1A1A1A] border border-[#333] text-[#E4E3E0] px-1.5 py-0.5 rounded font-mono font-medium">EBAY_AU</span>
                </div>
              </div>
              <div className="bg-[#0D0D0D] p-4 rounded-sm border border-[#262626] shadow-none">
                <p className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Average Price</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-mono text-[#E4E3E0]">
                    {stats.average > 0 ? `$${stats.average.toLocaleString('en-AU', { maximumFractionDigits: 0 })}` : 'N/A'}
                  </span>
                  <span className="text-[10px] bg-[#141414] text-[#888] px-1.5 py-0.5 rounded font-mono">AUD</span>
                </div>
              </div>
              <div className="bg-[#0D0D0D] p-4 rounded-sm border border-[#262626] shadow-none">
                <p className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Lowest Price</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-mono text-[#E4E3E0]">
                    {stats.min > 0 ? `$${stats.min.toLocaleString('en-AU', { maximumFractionDigits: 0 })}` : 'N/A'}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">lowest</span>
                </div>
              </div>
              <div className="bg-[#0D0D0D] p-4 rounded-sm border border-[#262626] shadow-none">
                <p className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Unique Suburbs</p>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-mono text-[#E4E3E0]">{stats.locations}</span>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded font-mono">locations</span>
                </div>
              </div>
            </div>

            {/* Filter Hub Card */}
            <div className="bg-[#0D0D0D] rounded-sm border border-[#262626] p-5 shadow-none space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#262626]">
                <h2 className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-[#E4E3E0]" /> Filter & Refinement Engine
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[#888]">{filteredItems.length} of {items.length} records shown</span>
                </div>
              </div>

              {/* Text Search & Condition select */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 relative">
                  <Search size={16} className="absolute left-3 top-3 text-[#555]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hardware models, CPUs, GPUs, sellers, descriptions..."
                    className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-[#E4E3E0] focus:ring-1 focus:ring-[#444] rounded-sm pl-10 pr-4 py-2 text-sm outline-none transition text-[#E4E3E0] placeholder:text-[#444]"
                  />
                </div>

                <div className="md:col-span-4 flex items-center justify-center bg-[#0A0A0A] px-3 py-1.5 rounded-sm border border-[#262626]">
                  <span className="text-xs font-semibold text-[#888] uppercase tracking-wider font-mono">Target: EBAY_AU Listings</span>
                </div>
              </div>

              {/* Secondary Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                {/* Min Price */}
                <div>
                  <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Min Price ($ AUD)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full bg-[#0A0A0A] border border-[#262626] focus:border-[#E4E3E0] rounded-sm px-3 py-1.5 text-xs text-[#E4E3E0] outline-none"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Max Price ($ AUD)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="e.g. 5000"
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
                    <option value="new">New / Brand New</option>
                    <option value="used">Used / Excellent / Refurbished</option>
                    <option value="parts">For Parts / Faulty / Untested</option>
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
                    <option value="scraped-new">Scraped At (Newest)</option>
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
                  <ListFilter size={14} className="text-[#E4E3E0]" /> Active Price Distribution (AUD)
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
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 bg-[#141414] text-[10px] text-[#E4E3E0] px-1.5 py-0.5 rounded font-mono border border-[#333] pointer-events-none transition duration-150 shadow-none z-10">
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
                  <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase font-mono">Target Schema Dataset (EBAY_AU)</span>
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

              {/* Add Custom Row Inline Form */}
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
                          placeholder="Listing Title (e.g., Lenovo ThinkPad T14)"
                          value={manualItemForm.title}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none col-span-1 md:col-span-2"
                        />
                        <input
                          type="number"
                          required
                          placeholder="Price (AUD, e.g. 1200)"
                          value={manualItemForm.price_aud || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, price_aud: parseFloat(e.target.value) || 0 }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Condition (e.g. Excellent - Refurbished)"
                          value={manualItemForm.condition_label}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, condition_label: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Pickup Location (e.g. Melbourne, VIC)"
                          value={manualItemForm.pickup_location_text || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, pickup_location_text: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="CPU Name (e.g., Intel i7-12700H)"
                          value={manualItemForm.cpu_name || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, cpu_name: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="GPU Name (e.g., NVIDIA RTX 3060)"
                          value={manualItemForm.gpu_name || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, gpu_name: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="number"
                          placeholder="System RAM (GB, e.g. 32)"
                          value={manualItemForm.total_system_ram || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, total_system_ram: parseInt(e.target.value) || 0 }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Storage (e.g., 1TB SSD)"
                          value={manualItemForm.storage || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, storage: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Exact Model Name"
                          value={manualItemForm.exact_model_name || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, exact_model_name: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Listing URL"
                          value={manualItemForm.url || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, url: e.target.value }))}
                          className="bg-[#0D0D0D] border border-[#262626] text-xs rounded p-2 text-[#E4E3E0] outline-none col-span-1 md:col-span-2"
                        />
                        <input
                          type="text"
                          placeholder="Seller Name"
                          value={manualItemForm.seller_name || ""}
                          onChange={(e) => setManualItemForm(prev => ({ ...prev, seller_name: e.target.value }))}
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
                      <th className="py-3 px-4">Platform</th>
                      <th className="py-3 px-4">Listing Detail Specs</th>
                      <th className="py-3 px-4 text-right">Price (AUD)</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#262626]">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#555] text-xs italic">
                          No matching eBay records found in this workspace view.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isEditing = editingId === item.id;
                        
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
                            <td className="py-3 px-4 font-mono font-bold text-[#6A9955]">
                              {item.platform || "EBAY_AU"}
                            </td>
                            <td className="py-3 px-4 max-w-sm">
                              {isEditing ? (
                                <div className="space-y-2 py-1">
                                  <div>
                                    <label className="text-[9px] text-[#555] block font-bold font-mono">Title</label>
                                    <input
                                      type="text"
                                      value={editForm.title}
                                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                      className="w-full bg-[#0D0D0D] text-xs border border-[#444] rounded p-1 outline-none text-[#E4E3E0]"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[9px] text-[#555] block font-bold font-mono">CPU</label>
                                      <input
                                        type="text"
                                        value={editForm.cpu_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, cpu_name: e.target.value })}
                                        className="w-full bg-[#0D0D0D] text-xs border border-[#444] rounded p-1 outline-none text-[#E4E3E0]"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-[#555] block font-bold font-mono">GPU</label>
                                      <input
                                        type="text"
                                        value={editForm.gpu_name || ""}
                                        onChange={(e) => setEditForm({ ...editForm, gpu_name: e.target.value })}
                                        className="w-full bg-[#0D0D0D] text-xs border border-[#444] rounded p-1 outline-none text-[#E4E3E0]"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[9px] text-[#555] block font-bold font-mono">RAM (GB)</label>
                                      <input
                                        type="number"
                                        value={editForm.total_system_ram || ""}
                                        onChange={(e) => setEditForm({ ...editForm, total_system_ram: e.target.value })}
                                        className="w-full bg-[#0D0D0D] text-xs border border-[#444] rounded p-1 outline-none text-[#E4E3E0]"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[9px] text-[#555] block font-bold font-mono">Storage</label>
                                      <input
                                        type="text"
                                        value={editForm.storage || ""}
                                        onChange={(e) => setEditForm({ ...editForm, storage: e.target.value })}
                                        className="w-full bg-[#0D0D0D] text-xs border border-[#444] rounded p-1 outline-none text-[#E4E3E0]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-[#CCC] font-medium leading-snug">
                                    {item.title}
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#555] font-mono mt-1">
                                    {item.condition_label && <span>COND: <span className="text-[#888]">{item.condition_label}</span></span>}
                                    {item.seller_name && <span className="text-[#777]">SELLER: {item.seller_name} {item.seller_rating && `(${item.seller_rating}%)`}</span>}
                                    {item.exact_model_name && <span className="text-emerald-500/80">MODEL: {item.exact_model_name}</span>}
                                    {item.cpu_name && <span>CPU: {item.cpu_name}</span>}
                                    {item.gpu_name && <span>GPU: {item.gpu_name}</span>}
                                    {item.total_system_ram && <span>RAM: {item.total_system_ram}GB</span>}
                                    {item.storage && <span>STORAGE: {item.storage}</span>}
                                    {item.vram_capacity && <span>VRAM: {item.vram_capacity}GB</span>}
                                    {item.shipping_type && <span>POSTAGE: {item.shipping_type}</span>}
                                  </div>
                                  {item.url && (
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#888] hover:text-[#E4E3E0] inline-flex items-center gap-1 mt-1 font-mono">
                                      Visit Original Listing <ExternalLink size={10} />
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
                                  className="w-20 bg-[#0D0D0D] text-xs text-right border border-[#444] rounded p-1 outline-none text-[#E4E3E0] font-mono"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                />
                              ) : (
                                <span>{item.price_aud ? `$${item.price_aud.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#777]">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.pickup_location_text || ""}
                                  onChange={(e) => setEditForm({ ...editForm, pickup_location_text: e.target.value })}
                                  className="w-24 bg-[#0D0D0D] text-xs border border-[#444] rounded p-1 outline-none text-[#CCC]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                />
                              ) : (
                                <span className="truncate max-w-[120px] block" title={item.pickup_location_text || ""}>{item.pickup_location_text || "N/A"}</span>
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

      {/* Persistent Footer Metrics */}
      <footer className="mt-4 h-8 flex items-center justify-between px-8 text-[10px] font-mono text-[#444] border-t border-[#262626] bg-[#0A0A0A]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)] ${isScraping ? 'bg-orange-500' : 'bg-gray-600'}`}></div>
            <span>SCRAPER_STATUS: {isScraping ? 'EXTRACTING' : 'READY'}</span>
          </div>
          <div>ACTIVE_SCHEMA: EBAY_HARDWARE_LISTING</div>
          <div>PLATFORM: CLOUD_INTEGRATION_OK</div>
        </div>
      </footer>

    </div>
  );
}
