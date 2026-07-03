import express from "express";
import cors from "cors";
import path from "path";
import * as cheerio from "cheerio";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const cleanHtmlContent = (html: string) => {
  const $ = cheerio.load(html);
  // Remove non-content structural elements to preserve tokens
  $('script, style, nav, footer, header, svg, img, iframe, noscript').remove();
  let text = $('body').text();
  text = text.replace(/\s+/g, ' ').trim();
  return text.substring(0, 90000); 
};

app.post('/api/scrape', async (req, res) => {
  const { url, manualHtml, delayMs = 1500 } = req.body;
  const logs: any[] = [];
  
  const addLog = (level: string, message: string) => {
    logs.push({ timestamp: new Date().toLocaleTimeString(), level, message });
    console.log(`[${level.toUpperCase()}] ${message}`);
  };

  try {
    let htmlContent = manualHtml;

    if (!htmlContent) {
      if (!url) {
        throw new Error('URL is required if manual HTML is not provided.');
      }
      addLog('info', `Executing gentle scrape delay (${delayMs}ms) to respect server rate limits...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      addLog('info', 'Fetching remote eBay page payload...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP Fetch failed with status ${response.status}.`);
      }
      htmlContent = await response.text();
      addLog('success', `Successfully fetched raw HTML page (${Math.round(htmlContent.length / 1024)} KB)`);
    } else {
      addLog('info', `Processing manual HTML paste (${Math.round(htmlContent.length / 1024)} KB)...`);
    }

    addLog('info', 'Pre-processing raw HTML page to reduce token clutter...');
    const cleanedHtml = cleanHtmlContent(htmlContent);
    addLog('success', `Compressed raw HTML to cleaned structure (${Math.round(cleanedHtml.length / 1024)} KB)`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    
    addLog('info', 'Connecting to Gemini AI engine to extract hardware listing details...');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are a specialized e-commerce data extraction API focused entirely on eBay AU hardware listing schemas.
Your task is to analyze the provided cleaned HTML content or raw page text from an eBay search results page, an eBay item listing, or a user's private eBay Watchlist / Saved Items page, and deeply extract all individual hardware product listings visible on the page.

Strict Compliance Requirements:
1. Extract as many valid listings as possible.
2. For each listing, populate the fields according to the exact eBay Hardware Listing Schema.
3. Keep the platform field strictly as "EBAY_AU".
4. Ensure types are correctly cast:
   - price_aud must be a float (number) representing the AUD price (e.g., 6500.00). If in another currency, convert to approximate AUD or extract the numeric portion.
   - seller_rating must be a float (number or null) representing the rating percentage (e.g., 99.5).
   - vram_capacity must be an integer (number or null) in GB.
   - total_system_ram must be an integer (number or null) in GB.
   - touchscreen_digitizer must be a boolean (true, false, or null).
5. All schema fields must be present and match the required list.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Cleaned HTML Content / Raw text:\n\n${cleanedHtml}\n\nPlease extract all eBay hardware items.`
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of extracted eBay AU hardware listings",
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              listing_id: { type: Type.STRING },
              url: { type: Type.STRING },
              title: { type: Type.STRING },
              price_aud: { type: Type.NUMBER },
              seller_name: { type: Type.STRING },
              seller_rating: { type: Type.NUMBER, nullable: true },
              condition_code: { type: Type.STRING },
              condition_label: { type: Type.STRING },
              shipping_type: { type: Type.STRING, nullable: true },
              pickup_location_text: { type: Type.STRING, nullable: true },
              category_path: { type: Type.STRING },
              full_listing_text: { type: Type.STRING },
              gpu_name: { type: Type.STRING, nullable: true },
              vram_capacity: { type: Type.INTEGER, nullable: true },
              cpu_name: { type: Type.STRING, nullable: true },
              total_system_ram: { type: Type.INTEGER, nullable: true },
              storage: { type: Type.STRING, nullable: true },
              egpu_model: { type: Type.STRING, nullable: true },
              touchscreen_digitizer: { type: Type.BOOLEAN, nullable: true },
              exact_model_name: { type: Type.STRING, nullable: true }
            },
            required: [
              "platform",
              "listing_id",
              "url",
              "title",
              "price_aud",
              "seller_name",
              "seller_rating",
              "condition_code",
              "condition_label",
              "shipping_type",
              "pickup_location_text",
              "category_path",
              "full_listing_text",
              "gpu_name",
              "vram_capacity",
              "cpu_name",
              "total_system_ram",
              "storage",
              "egpu_model",
              "touchscreen_digitizer",
              "exact_model_name"
            ]
          }
        }
      }
    });

    const responseText = response.text || '[]';
    let items: any[] = [];
    try {
      items = JSON.parse(responseText);
    } catch (parseErr) {
      addLog('warning', 'Gemini returned invalid JSON structure. Attempting regex fallback parsing...');
      const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse structured JSON from Gemini response.');
      }
    }

    addLog('info', `Enriching and verifying ${items.length} extracted eBay hardware listings...`);
    const enrichedItems = items.map((item: any, idx: number) => {
      const finalPlatform = item.platform || 'EBAY_AU';
      const timestamp = Date.now();
      const id = "scraped-" + finalPlatform + "-" + timestamp + "-" + idx;

      return {
        id,
        platform: finalPlatform,
        listing_id: item.listing_id || String(timestamp + idx),
        url: item.url || url || "https://www.ebay.com.au",
        title: item.title || "Untitled eBay Listing",
        price_aud: typeof item.price_aud === 'number' ? item.price_aud : parseFloat(String(item.price_aud || 0).replace(/[^\d.]/g, '')) || 0,
        seller_name: item.seller_name || "Unknown Seller",
        seller_rating: item.seller_rating !== undefined ? item.seller_rating : null,
        condition_code: item.condition_code || "1000",
        condition_label: item.condition_label || "Unknown",
        shipping_type: item.shipping_type || "Standard Postage",
        pickup_location_text: item.pickup_location_text || "Australia",
        category_path: item.category_path || "Computers/Tablets & Networking > Laptops & Netbooks",
        full_listing_text: item.full_listing_text || item.title || "",
        scraped_at: item.scraped_at || new Date().toISOString(),
        gpu_name: item.gpu_name || null,
        vram_capacity: item.vram_capacity !== undefined ? item.vram_capacity : null,
        cpu_name: item.cpu_name || null,
        total_system_ram: item.total_system_ram !== undefined ? item.total_system_ram : null,
        storage: item.storage || null,
        egpu_model: item.egpu_model || null,
        touchscreen_digitizer: item.touchscreen_digitizer !== undefined ? item.touchscreen_digitizer : null,
        exact_model_name: item.exact_model_name || null,
        numericPrice: typeof item.price_aud === 'number' ? item.price_aud : parseFloat(String(item.price_aud || 0).replace(/[^\d.]/g, '')) || 0
      };
    });

    addLog('success', `Extraction completed! Generated dataset of ${enrichedItems.length} items conforming to your eBay schema.`);
    
    res.json({
      success: true,
      items: enrichedItems,
      logs
    });
  } catch (error: any) {
    addLog('error', 'Operation failed: ' + error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      logs
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://0.0.0.0:" + PORT);
  });
}

startServer();
