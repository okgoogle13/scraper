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

const detectPlatform = (url: string) => {
  if (!url) return 'generic';
  const u = url.toLowerCase();
  if (u.includes('ebay')) return 'ebay';
  if (u.includes('amazon')) return 'amazon';
  if (u.includes('gumtree')) return 'gumtree';
  if (u.includes('facebook')) return 'facebook';
  return 'generic';
};

const cleanHtmlContent = (html: string) => {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, svg, img, iframe').remove();
  let text = $('body').text();
  text = text.replace(/\s+/g, ' ').trim();
  return text.substring(0, 80000); 
};

app.post('/api/scrape', async (req, res) => {
  const { url, platform, delayMs = 1500, engine = 'infatica', manualHtml } = req.body;
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
      addLog('info', 'Executing gentle scrape delay (' + delayMs + 'ms) to respect server rate limits...');
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      addLog('info', 'Fetching remote URL payload...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      if (!response.ok) {
        throw new Error('HTTP Fetch failed with status ' + response.status + '.');
      }
      htmlContent = await response.text();
      addLog('success', 'Successfully fetched raw HTML page (' + Math.round(htmlContent.length / 1024) + ' KB)');
    }

    addLog('info', 'Pre-processing raw HTML page to reduce token clutter...');
    const cleanedHtml = cleanHtmlContent(htmlContent);
    addLog('success', 'Compressed raw HTML to cleaned structure (' + Math.round(cleanedHtml.length / 1024) + ' KB)');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    
    addLog('info', 'Connecting to Gemini AI engine to extract and structure listing details...');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let systemInstruction = '';
    if (engine === 'infatica') {
      systemInstruction = `You are an expert e-commerce data extraction API mirroring tools like Infatica.
Your task is to analyze the provided cleaned HTML content or raw page text from a marketplace search page (OR a user's private Watchlist/Saved Items page) and deeply extract all individual product listings visible on the page.

Guidelines:
1. Extract as many listings as possible. Ensure they are actual product listings.
2. For each listing, extract deeply. We need:
   - platform: Marketplace platform name
   - listing_id: Unique ID of the listing if available
   - url: URL to the item page
   - title: Listing title or primary item name
   - price_aud: Formatted price string (e.g. "$120.00", assume AUD if on ebay AU)
   - seller_name: Name of the seller or store
   - seller_rating: Seller feedback score or rating percentage
   - condition_code: The condition code if available (e.g., '1000' for new)
   - condition_label: Condition of the item (e.g., 'Used - Very Good')
   - shipping_type: Cost or type of shipping (e.g., 'Free shipping', '+$5.00 shipping')
   - pickup_location_text: Location or seller details
   - category_path: The category breadcrumb if available
   - full_listing_text: The full combined text from the listing, including title, specifics, and description. This acts as the grounding text.
   - gpu_name, vram_capacity, cpu_name, total_system_ram, storage, egpu_model, touchscreen_digitizer, exact_model_name: Extract these hardware hints if available, otherwise null.
3. Only return actual products.`;
    } else {
      systemInstruction = `You are a heuristic table extraction engine mirroring tools like Instant Data Scraper.
Your task is to automatically detect the primary repeating tabular data or listing items on the page and extract them.

Guidelines:
1. Extract title, price_aud, seller details, condition, location, and hardware hints (gpu_name, etc.) if possible.
2. Ensure full_listing_text contains the grounding text.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Cleaned Page HTML Content:\n\n${cleanedHtml}\n\nPlease extract the listings.`
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of extracted data rows/listings",
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              listing_id: { type: Type.STRING },
              url: { type: Type.STRING },
              title: { type: Type.STRING },
              price_aud: { type: Type.STRING },
              seller_name: { type: Type.STRING },
              seller_rating: { type: Type.STRING },
              condition_code: { type: Type.STRING },
              condition_label: { type: Type.STRING },
              shipping_type: { type: Type.STRING },
              pickup_location_text: { type: Type.STRING },
              category_path: { type: Type.STRING },
              full_listing_text: { type: Type.STRING },
              gpu_name: { type: Type.STRING, nullable: true },
              vram_capacity: { type: Type.STRING, nullable: true },
              cpu_name: { type: Type.STRING, nullable: true },
              total_system_ram: { type: Type.STRING, nullable: true },
              storage: { type: Type.STRING, nullable: true },
              egpu_model: { type: Type.STRING, nullable: true },
              touchscreen_digitizer: { type: Type.STRING, nullable: true },
              exact_model_name: { type: Type.STRING, nullable: true }
            },
            required: ["title", "price_aud"]
          }
        }
      }
    });

    const responseText = response.text || '[]';
    let items: any[] = [];
    try {
      items = JSON.parse(responseText);
    } catch (parseErr) {
      addLog('warning', 'Gemini returned invalid JSON structure. Attempting loose regex fallback parsing...');
      const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse structured JSON from Gemini response.');
      }
    }

    addLog('info', 'Enriching and verifying ' + items.length + ' extracted listings...');
    const enrichedItems = items.map((item: any, idx: number) => {
      let numericPrice: number | null = null;
      if (item.price_aud) {
        const numStr = item.price_aud.replace(/[^\\d.]/g, '');
        const parsed = parseFloat(numStr);
        if (!isNaN(parsed)) {
          numericPrice = parsed;
        }
      }

      let finalPlatform = item.platform || platform;
      if (finalPlatform === 'auto') {
        finalPlatform = detectPlatform(item.url || url || '');
      }

      const timestamp = Date.now();
      const id = "scraped-" + finalPlatform + "-" + timestamp + "-" + idx;

      return {
        id,
        platform: finalPlatform || "",
        listing_id: item.listing_id || "",
        url: item.url || url || "",
        title: item.title || "Untitled Listing",
        price_aud: item.price_aud || "Contact Seller",
        seller_name: item.seller_name || "",
        seller_rating: item.seller_rating || "",
        condition_code: item.condition_code || "",
        condition_label: item.condition_label || "",
        shipping_type: item.shipping_type || "",
        pickup_location_text: item.pickup_location_text || "",
        category_path: item.category_path || "",
        full_listing_text: item.full_listing_text || item.title || "",
        scraped_at: new Date().toISOString(),
        gpu_name: item.gpu_name || null,
        vram_capacity: item.vram_capacity || null,
        cpu_name: item.cpu_name || null,
        total_system_ram: item.total_system_ram || null,
        storage: item.storage || null,
        egpu_model: item.egpu_model || null,
        touchscreen_digitizer: item.touchscreen_digitizer || null,
        exact_model_name: item.exact_model_name || null,
        numericPrice
      };
    });

    addLog('success', 'Extraction successfully completed! Generated unified dataset containing ' + enrichedItems.length + ' items.');
    
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
