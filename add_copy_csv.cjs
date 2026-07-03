const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `  const copyCSVToClipboard = () => {
    const itemsToExport = selectedIds.size > 0 ? filteredItems.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) return;
    
    const headers = ["Title", "Price", "Numeric Price", "Currency", "Condition", "Location", "Shipping", "Seller", "Rating", "Stock", "Bids", "Marketplace", "URL", "Extra", "Scraped At"];
    const rows = itemsToExport.map(item => [
      \`"\${(item.title || "").replace(/"/g, '""')}"\`,
      \`"\${(item.price_aud || "").replace(/"/g, '""')}"\`,
      item.numericPrice || "",
      \`"AUD"\`,
      \`"\${(item.condition_label || "Unknown").replace(/"/g, '""')}"\`,
      \`"\${(item.pickup_location_text || "N/A").replace(/"/g, '""')}"\`,
      \`"\${(item.shipping_type || "").replace(/"/g, '""')}"\`,
      \`"\${(item.seller_name || "").replace(/"/g, '""')}"\`,
      \`"\${(item.seller_rating || "").replace(/"/g, '""')}"\`,
      \`"\${(item.gpu_name || "").replace(/"/g, '""')}"\`,
      \`"\${(item.cpu_name || "").replace(/"/g, '""')}"\`,
      \`"\${item.platform.toUpperCase()}"\`,
      \`"\${item.url}"\`,
      \`"\${(item.full_listing_text || "").replace(/"/g, '""')}"\`,
      \`"\${item.scraped_at}"\`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\\n");
    navigator.clipboard.writeText(csvContent);
    appendLogs([{ timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'CSV copied to clipboard' }]);
  };

  const copyToClipboard = () => {`;

code = code.replace(/  const copyToClipboard = \(\) => \{/, replacement);

const buttonReplacement = `                  <button
                    onClick={copyCSVToClipboard}
                    disabled={filteredItems.length === 0}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0A] border border-[#262626] hover:bg-[#141414] text-[#E4E3E0] rounded flex items-center gap-1 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Clipboard size={12} /> {selectedIds.size > 0 ? \`Copy CSV (\${selectedIds.size})\` : "Copy CSV"}
                  </button>
                  <button
                    onClick={copyToClipboard}
                    disabled={filteredItems.length === 0}
                    className="px-2.5 py-1 text-xs bg-[#0A0A0A] border border-[#262626] hover:bg-[#141414] text-[#E4E3E0] rounded flex items-center gap-1 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Clipboard size={12} /> {selectedIds.size > 0 ? \`Copy JSON (\${selectedIds.size})\` : "Copy JSON"}
                  </button>`;

code = code.replace(/<button[^>]*onClick=\{copyToClipboard\}[^>]*>[\s\S]*?<\/button>/, buttonReplacement);

fs.writeFileSync('src/App.tsx', code);
