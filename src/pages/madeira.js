/*******************************************************
 * madeira.js - Uses Local Server Proxy for Session
 *******************************************************/

const DELAY = 2000;    // Pause between searches, in milliseconds
const DEBUG_MODE = true;

// Helper function for debug logging
function debugLog(...messages) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', new Date().toISOString(), ...messages);
  }
}

// Normalise Pantone code (remove "PANTONE+" etc.)
function normalisePantoneCode(pantoneCode = "") {
  return pantoneCode.replace(/^pantone\s*\+?/i, "").trim();
}

/**
 * Extract structured product data from the returned HTML:
 * Each product is in a container like
 * <div class="cat1 cat3 col-md-2 col-xs-6 inner-products position-relative">
 *   ...
 *   <img class="productImageSmall colourImg" src="/data/media/images/products/9111383.jpg" alt="CLASSIC 40 ...">
 *   ...
 *   <small><span class="article-number">Colour:</span>1383</small>
 *   <small><span class="article-name">CLASSIC 40 1000M CERISE</span></small>
 * </div>
 */
function extractResults(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const results = [];

  const productDivs = doc.querySelectorAll('.cat1.cat3.col-md-2.col-xs-6.inner-products');
  productDivs.forEach(div => {
    const imgEl = div.querySelector('img.productImageSmall');
    let imageUrl = imgEl ? imgEl.getAttribute('src') : null;

    // Gather colour ID and product name
    let colorId = null;
    let productName = null;

    const smallEls = div.querySelectorAll('small');
    smallEls.forEach(s => {
      const text = s.textContent.trim();
      if (text.startsWith('Colour:')) {
        colorId = text.replace('Colour:', '').trim();
      } else {
        const articleNameSpan = s.querySelector('.article-name');
        if (articleNameSpan) {
          productName = articleNameSpan.textContent.trim();
        } else {
          // fallback if no span, but text is valid
          if (!productName && !text.startsWith('Colour:')) {
            productName = text;
          }
        }
      }
    });

    // We only store the object if at least one field is found
    if (imageUrl || colorId || productName) {
      results.push({
        imageUrl,      // relative to shop.madeira.co.uk
        colorId,
        productName
      });
    }
  });

  debugLog("Parsed results:", results);
  return results;
}

/**
 * Single Pantone search: fetch the Madeira page, parse out product containers.
 */
async function searchPantone(pantoneCode) {
  const cleanedCode = normalisePantoneCode(pantoneCode);

  // Build the real Madeira URL (without session ID).
  const params = new URLSearchParams({
    searchWord: cleanedCode,
    Submit: "search",
    searchFields: "productsColorPantone",
    page: "search",
    offsetProduct: "0",
    pageNav: "1"
  });

  const baseUrl = `https://shop.madeira.co.uk/index.php?${params.toString()}`;
  // Now call our local server proxy, which appends the session ID for us
  const encodedUrl = encodeURIComponent(baseUrl);
  const proxiedUrl = `/proxy/${encodedUrl}`;

  debugLog("Proxy request URL:", proxiedUrl);

  // Fetch from our local Node server (which will pass it to Madeira)
  const response = await fetch(proxiedUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  debugLog(`Search response status: ${response.status}`);

  const html = await response.text();
  debugLog("HTML response length:", html.length);

  // Return structured product data
  return extractResults(html);
}

/**
 * Exported function to search multiple Pantones. 
 * Returns an object of shape { [pantoneCode]: Array<productObject> }
 */
export async function searchMadeiraPantones(pantoneArray) {
  const results = {};

  for (const code of pantoneArray) {
    // Pause between calls to be polite & avoid server side issues
    await new Promise(resolve => setTimeout(resolve, DELAY));

    try {
      const found = await searchPantone(code);
      results[code] = found;
    } catch (error) {
      console.error("Error for code", code, ":", error);
      results[code] = [];
    }
  }

  return results;
}
