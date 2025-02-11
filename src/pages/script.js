/*******************************************************
 * script.js - Enhanced Pantone and Hex Colour Matcher - MASTER VERSION (Combined RGB & CIELab)
 *******************************************************/

/*******************************************************
 * 1. Load & Transform Pantone, Threads, and Madeira Threads Data
 *******************************************************/
// let currentLogoDataUrl = null;
let pantoneData = [];
let threadsData = [];
let madeiraThreadsData = [];
let colourMode = 'rgb'; // Default to RGB color matching
// let currentLogoFile = null;
// let currentLogoFile = null;

window.addEventListener("load", () => {
  // Fetch Pantone Data
  fetch("pantone.json")
    .then(res => {
      if (!res.ok) {
        throw new Error("Could not load pantone.json");
      }
      return res.json();
    })
    .then(rawArray => {
      pantoneData = rawArray.map(entry => {
        const rgbArray = entry[0];
        const infoArray = entry[1];
        return {
          code: infoArray[0],
          r: rgbArray[0],
          g: rgbArray[1],
          b: rgbArray[2],
          cmyk: infoArray[1],
          hex: infoArray[3]
        };
      });
      console.log(`Loaded ${pantoneData.length} Pantone entries.`);
    })
    .catch(err => {
      console.error(err);
      alert("Error loading Pantone data: " + err.message);
    });

  // Fetch Threads Data (Stock)
  fetch("/api/threads")
    .then(res => {
      if (!res.ok) {
        throw new Error("Could not load threads.json");
      }
      return res.json();
    })
    .then(data => {
      threadsData = data;
      console.log(`Loaded ${threadsData.length} stock threads.`);
    })
    .catch(err => {
      console.error(err);
      alert("Error loading threads data: " + err.message);
    });

  // Fetch Madeira Threads Data
  fetch("/api/madeiraThreads")
    .then(res => {
      if (!res.ok) {
        throw new Error("Could not load madeiraThreads.json");
      }
      return res.json();
    })
    .then(data => {
      madeiraThreadsData = data;
      console.log(`Loaded ${madeiraThreadsData.length} Madeira threads.`);
    })
    .catch(err => {
      console.error(err);
      alert("Error loading Madeira threads data: " + err.message);
    });
});

/*******************************************************
 * 2. DOM References
 *******************************************************/
const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const fileButton = document.getElementById("fileButton");
const resultsDiv = document.getElementById("results");
const hiddenCanvas = document.getElementById("hiddenCanvas");
const ctx = hiddenCanvas.getContext("2d");
const uploadedImage = document.getElementById("uploadedImage");
const manualColourList = document.getElementById("manualColourList");
const threadList = document.getElementById("threadList");

/*******************************************************
 * 3. Drag-and-Drop + File Input (Same as before)
 *******************************************************/
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
});
['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
});

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const files = e.dataTransfer.files;
  if (files && files.length) {
    handleUploadedFile(files[0]);
  }
}

let debounceTimer; // Declare a timer variable outside the function

fileInput.addEventListener("change", (e) => { // Changed to anonymous function for debouncing
    clearTimeout(debounceTimer); // Clear any existing timer
    debounceTimer = setTimeout(() => { // Set a delay before executing handleFile
        handleFile(e); // Call handleFile after the delay
    }, 200); // 200ms delay (you can adjust this value)
});

function handleFile(e) {
    if (!e.target.files.length) return;
    handleUploadedFile(e.target.files[0]);
}

/*******************************************************
 * 4. Master File Handler (Same as before) - CORRECTED
 *******************************************************/
function handleUploadedFile(file) {
  // ... (rest of handleUploadedFile function - no changes) ...
    // Reference to the main results container
  const resultsEl = document.getElementById("results");

  // Clear the main results content
  resultsEl.innerHTML = "<p>Processing…</p>";

  // Remove any existing Madeira results
  const oldMadeiraPantone = document.getElementById("madeiraResults");
  if (oldMadeiraPantone) {
    oldMadeiraPantone.remove();
  }
  const oldMadeiraHex = document.getElementById("madeiraResultsHex");
  if (oldMadeiraHex) {
    oldMadeiraHex.remove();
  }

  // Reset other UI elements
  uploadedImage.src = "";
  manualColourList.innerHTML = "";
  threadList.innerHTML = "";

  const nameLower = file.name.toLowerCase();

  // Show preview if it's a supported format
  if (file.type.startsWith("image/") || nameLower.endsWith(".svg") ||
      nameLower.endsWith(".eps") || nameLower.endsWith(".pdf")) {
    const reader = new FileReader();
    reader.onload = function(e) { // <-- CORRECTED: ONLY ONE reader.onload, NOT NESTED!
      uploadedImage.src = e.target.result;
      currentLogoDataUrl = e.target.result; // ADD THIS LINE - store the Data URL
      currentLogoFile = file;
      // Show the image container after image is loaded
      imageContainer.style.display = 'block';
      // You would also process the image for color analysis here in script.js
      console.log('File uploaded and image displayed');
    }; // <-- CORRECTED: Closing brace for reader.onload
    reader.readAsDataURL(file);
  }

  // Handle file based on its type
  if (nameLower.endsWith(".pdf")) {
    if (typeof pdfjsLib !== "undefined") {
      processPDF(file);
    } else {
      resultsEl.innerHTML = "<p>PDF.js library not found.</p>";
    }
  }
  else if (nameLower.endsWith(".eps")) {
    resultsEl.innerHTML = "<p>EPS not supported without external library. Convert to PDF or SVG.</p>";
  }
  else if (nameLower.endsWith(".svg")) {
    const reader = new FileReader();
    reader.onload = ev => {
      processSVG(ev.target.result);
    };
    reader.readAsText(file);
  }
  else if (file.type.startsWith("image/")) {
    rasterProcess(file);
  }
  else {
    resultsEl.innerHTML = "<p>Unsupported file type.</p>";
  }
}

/*******************************************************
 * 5. PDF Handler (Same as before)
 *******************************************************/
async function processPDF(file) {
  // ... (rest of processPDF function - no changes) ...
      try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });

    hiddenCanvas.width = viewport.width;
    hiddenCanvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport
    };
    await page.render(renderContext).promise;

    const distinct = getDistinctColoursFromCanvas(ctx, viewport.width, viewport.height);
    displayResults(distinct);
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = `<p>Error reading PDF: ${err.message}</p>`;
  }
}

/*******************************************************
 * 6. SVG -> Canvas (Same as before)
 *******************************************************/
function processSVG(svgText) {
  // ... (rest of processSVG function - no changes) ...
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    hiddenCanvas.width = img.width;
    hiddenCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const distinct = getDistinctColoursFromCanvas(ctx, img.width, img.height);
    displayResults(distinct);
  };
  img.onerror = () => {
    resultsDiv.innerHTML = "<p>Failed to load SVG.</p>";
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/*******************************************************
 * 7. Raster Processing (Same as before)
 *******************************************************/
function rasterProcess(file) {
  // ... (rest of rasterProcess function - no changes) ...
      const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const desiredWidth = 1000;
      const aspect = img.height / img.width;
      const newWidth = Math.min(img.width, desiredWidth);
      const newHeight = Math.round(newWidth * aspect);

      hiddenCanvas.width = newWidth;
      hiddenCanvas.height = newHeight;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      const distinct = getDistinctColoursFromCanvas(ctx, newWidth, newHeight);
      displayResults(distinct);
    };
    img.onerror = () => {
      resultsDiv.innerHTML = "<p>Failed to load image.</p>";
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

/*******************************************************
 * 8. getDistinctColoursFromCanvas (Same as before)
 *******************************************************/
function getDistinctColoursFromCanvas(ctx, width, height) {
  // ... (rest of getDistinctColoursFromCanvas function - no changes) ...
      const data = ctx.getImageData(0, 0, width, height).data;
  const totalPixels = width * height;

  const colourCounts = {};
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    // if (a < 255) continue; // Optional: Skip transparent pixels
    const hex = rgbToHex(r, g, b);
    if (!colourCounts[hex]) colourCounts[hex] = 0;
    colourCounts[hex]++;
  }

  const colourPercentages = {};
  for (const hex in colourCounts) {
    const count = colourCounts[hex];
    const perc = ((count / totalPixels) * 100).toFixed(2);
    colourPercentages[hex] = perc;
  }

  const threshold = 0.3; // 0.3%
  const results = [];
  for (const hex in colourPercentages) {
    if (parseFloat(colourPercentages[hex]) >= threshold) {
      results.push({ hex, percentage: colourPercentages[hex] });
    }
  }
  return results;
}

/*******************************************************
 * 9. Display Results (Conditional Colour Distance)
 *******************************************************/
function displayResults(colourObjects) {
  if (!colourObjects.length) {
    resultsDiv.innerHTML = "<p>No colours found.</p>";
    return;
  }

  // 1. Map each colour to nearest Pantone (Conditional distance calculation)
  const mapped = colourObjects.map(obj => {
    const rgb = hexToRgb(obj.hex);
    if (!rgb) {
      return { ...obj, pantone: "Unknown" };
    }

    let minDist = Infinity;
    let nearestPantone = null;

    for (const p of pantoneData) {
      let dist;
      if (colourMode === 'cielab') {
        const lab1 = rgbToLab(rgb.r, rgb.g, rgb.b);
        const lab2 = rgbToLab(p.r, p.g, p.b);
        dist = cie76Distance(lab1, lab2); // CIELab distance
      } else {
        dist = colourDistance(rgb.r, rgb.g, rgb.b, p.r, p.g, p.b); // RGB distance
      }

      if (dist < minDist) {
        minDist = dist;
        nearestPantone = p;
      }
    }
    return {
      ...obj,
      pantone: nearestPantone ? nearestPantone.code : "Unknown"
    };
  });

  // 2. Group coverage by Pantone (Same as before)
  const pantoneGroups = {};
  mapped.forEach(item => {
    if (item.pantone === "Unknown") return;
    const coverageNum = parseFloat(item.percentage);
    if (!pantoneGroups[item.pantone]) {
      pantoneGroups[item.pantone] = {
        coverage: 0,
        bestHex: item.hex,
        bestCov: coverageNum
      };
    }
    pantoneGroups[item.pantone].coverage += coverageNum;
    if (coverageNum > pantoneGroups[item.pantone].bestCov) {
      pantoneGroups[item.pantone].bestHex = item.hex;
      pantoneGroups[item.pantone].bestCov = coverageNum;
    }
  });

  // Build final array (Same as before)
  const finalArray = [];
  for (const pantone in pantoneGroups) {
    const group = pantoneGroups[pantone];
    finalArray.push({
      pantone,
      hex: group.bestHex,
      coverage: group.coverage.toFixed(2)
    });
  }

  if (!finalArray.length) {
    resultsDiv.innerHTML = "<p>No valid Pantone matches found.</p>";
    return;
  }

  // 3. Split, Sort, Group and Render (Same as before)
  const highCov = [];
  const lowCov = [];
  for (const entry of finalArray) {
    const c = parseFloat(entry.coverage);
    if (c > 3) {
      highCov.push(entry);
    } else {
      lowCov.push(entry);
    }
  }

  highCov.sort((a, b) => parseFloat(b.coverage) - parseFloat(a.coverage));

  const lowGroups = {};
  for (const entry of lowCov) {
    const hue = getHue(entry.hex);
    const groupKey = Math.floor(hue / 30) * 30;
    if (!lowGroups[groupKey]) {
      lowGroups[groupKey] = [];
    }
    lowGroups[groupKey].push(entry);
  }
  for (const g in lowGroups) {
    lowGroups[g].sort((a, b) => parseFloat(b.coverage) - parseFloat(a.coverage));
  }
  const sortedKeys = Object.keys(lowGroups).map(Number).sort((a, b) => a - b);
  const lowCoverageSorted = [];
  for (const g of sortedKeys) {
    lowCoverageSorted.push(...lowGroups[g]);
  }

  const finalSorted = [...highCov, ...lowCoverageSorted];

  let html = `<div class="colour-list">`;
  for (const item of finalSorted) {
    const highlightClass = parseFloat(item.coverage) > 3 ? "highlight" : "";
    html +=
      `<div class="colour-item ${highlightClass}">
        <div class="colour-swatch" style="background:${item.hex}"></div>
        <strong>${item.hex}</strong><br>
        Pantone: <em>${item.pantone}</em><br>
        <span class="colour-percentage">${item.coverage}%</span>
        <div class="colour-actions">
          <button onclick="addToThreadList('${item.hex}', '${item.pantone}')">Select</button>
        </div>
      </div>`;
  }
  html += `</div>`;
  resultsDiv.innerHTML = html;
}

/*******************************************************
 * 10. Add to Thread Matching (Same as before)
 *******************************************************/
function addToThreadList(hex, pantone) {
  // ... (rest of addToThreadList function - no changes) ...
      const existing = Array.from(threadList.children).find(c => c.dataset.pantone === pantone);
  if (existing) {
    alert("Pantone already in Thread Matching.");
    return;
  }
  const container = document.createElement("div");
  container.className = "colour-item";
  container.dataset.pantone = pantone;
  container.innerHTML =
    `<div class="colour-swatch" style="background:${hex}"></div>
    <strong>${hex}</strong><br>
    Pantone: <em>${pantone}</em>
    <div class="colour-actions">
      <button onclick="removeFromThreadList(this)">Remove</button>
    </div>`;
  threadList.appendChild(container);
}

 // Add Clear Results Button (Same as before)
const clearMadeiraResultsButton = document.getElementById("clearMadeiraResults");

clearMadeiraResultsButton.addEventListener("click", () => {
  // Remove any existing Madeira results
  const oldMadeiraPantone = document.getElementById("madeiraResults");
  if (oldMadeiraPantone) {
    oldMadeiraPantone.remove();
  }
  const oldMadeiraHex = document.getElementById("madeiraResultsHex");
  if (oldMadeiraHex) {
    oldMadeiraHex.remove();
  }

  console.log('Madeira results cleared.');
});

function removeFromThreadList(button) {
  // ... (rest of removeFromThreadList function - no changes) ...
  const item = button.closest(".colour-item");
  threadList.removeChild(item);
}

    /*******************************************************
   * 11. Manual Colour Search: Also add "Add for Thread" (Same as before)
   *******************************************************/
const manualSearchDiv = document.getElementById("manualSearch");
manualSearchDiv.style.display = "none"; // Hide on page load


uploadedImage.addEventListener("click", e => {
  // ... (rest of uploadedImage event listener - no changes) ...
      if (!uploadedImage.src) return;

  manualSearchDiv.style.display = "block"; // Make visible on click

  const rect = uploadedImage.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = uploadedImage.width;
  tempCanvas.height = uploadedImage.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(uploadedImage, 0, 0, uploadedImage.width, uploadedImage.height);

  const pixel = tempCtx.getImageData(x, y, 1, 1).data;
  const [r, g, b, a] = pixel;
  if (a === 0) {
    alert("Transparent area clicked.");
    return;
  }
  const hex = rgbToHex(r, g, b);

  let minDist = Infinity;
  let nearestPantone = null;
  for (const p of pantoneData) {
    const dist = colourDistance(r, g, b, p.r, p.g, p.b);
    if (dist < minDist) {
      minDist = dist;
      nearestPantone = p;
    }
  }
  const pantoneCode = nearestPantone ? nearestPantone.code : "Unknown";

  addManualColour(hex, pantoneCode);
});

function addManualColour(hex, pantoneCode) {
  // ... (rest of addManualColour function - no changes) ...
      const existing = Array.from(manualColourList.children).find(item => item.dataset.pantone === pantoneCode);
  if (existing) {
    alert("Pantone already in Manual Search.");
    return;
  }
  const div = document.createElement("div");
  div.className = "colour-item";
  div.dataset.pantone = pantoneCode;
  div.innerHTML =
    `<div class="colour-swatch" style="background:${hex}"></div>
    <strong>${hex}</strong><br>
    Pantone: <em>${pantoneCode}</em><br>
    <div class="colour-actions">
      <button onclick="addToThreadList('${hex}', '${pantoneCode}')">Select</button>
      <button onclick="removeManual(this)">Remove</button>
    </div>`;
  manualColourList.appendChild(div);
}

function removeManual(button) {
  // ... (rest of removeManual function - no changes) ...
      const item = button.closest(".colour-item");
  manualColourList.removeChild(item);
}

/*******************************************************
 * 12. Helper Functions (RGB, Hex, Hue - Same as before)
 *******************************************************/
function clamp01(x) {
  // ... (rest of clamp01 function - no changes) ...
  return Math.max(0, Math.min(1, x));
}

function cmykToRgb(c, m, y, k) {
  // ... (rest of cmykToRgb function - no changes) ...
  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  // ... (rest of rgbToHex function - no changes) ...
  return "#" + [r, g, b].map(x => {
    const h = x.toString(16);
    return h.length === 1 ? "0" + h : h;
  }).join("");
}

function hexToRgb(hex) {
  // ... (rest of hexToRgb function - no changes) ...
  if (!hex) return null;
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex[0]+hex[0] + hex[1]+hex[1] + hex[2]+hex[2];
  }
  if (hex.length !== 6) return null;
  const num = parseInt(hex, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: (num & 255)
  };
}

/**
 * Convert RGB to LAB values (Same as in CIELab script)
 */
function rgbToLab(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

    const gamma = (val) => (val > 0.04045) ? Math.pow(((val + 0.055) / 1.055), 2.4) : (val / 12.92);

    const R = gamma(r);
    const G = gamma(g);
    const B = gamma(b);


  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805);
  const Y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505);

    const whiteX = 95.047;
    const whiteY = 100;
    const whiteZ = 108.883;

  const refX = X / whiteX;
  const refY = Y / whiteY;
  const refZ = Z / whiteZ;

  const f = (val) => (val > 0.008856) ? Math.pow(val, 1 / 3) : ((7.787 * val) + (16 / 116));

    const fX = f(refX);
    const fY = f(refY);
    const fZ = f(refZ);

  const L = 116 * fY - 16;
  const a = 500 * (fX - fY);
  const b_lab = 200 * (fY - fZ); // Renamed 'b' to 'b_lab'

  return { L, a, b: b_lab }; // Ensure the returned value is also changed
}

/**
 * Calculate CIE76 distance between two LAB colors. (Same as in CIELab script)
 */
function cie76Distance(lab1, lab2) {
  return Math.sqrt(
    (lab1.L - lab2.L) ** 2 +
    (lab1.a - lab2.a) ** 2 +
    (lab1.b - lab2.b) ** 2
  );
}

/**
 * Convert hex to HSL, return hue (0..360). (Same as before)
 */
function getHue(hex) {
  // ... (rest of getHue function - no changes) ...
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  let { r, g, b } = rgb;
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return h;
}

/*******************************************************
 * 13. Colour Matching Functions for Madeira Results (Same as before)
 *******************************************************/

/**
 * Calculate Euclidean distance between two RGB colours. (Same as before)
 */
function colourDistance(r1, g1, b1, r2, g2, b2) {
  // ... (rest of colourDistance function - no changes) ...
  return Math.sqrt(
    (r1 - r2)**2 +
    (g1 - g2)**2 +
    (b1 - b2)**2
  );
}

/**
 * Calculate a match score from 0-100, based on Euclidean RGB distance. (Same as before)
 */
function calculateColorMatchScore(originalRGB, threadRGB) {
  // ... (rest of calculateColorMatchScore function - no changes) ...
  const maxDistance = 441.67; // sqrt(255^2 + 255^2 + 255^2)
  const distance = colourDistance(originalRGB.r, originalRGB.g, originalRGB.b, threadRGB.r, threadRGB.g, threadRGB.b);
  return Math.max(0, Math.round(100 - (distance / maxDistance) * 100));
}

/**
 * Find the closest threads based on hex code. (Same as before)
 */
function findClosestThreads(targetHex, threads, numClosest = 2) {
  // ... (rest of findClosestThreads function - no changes) ...
  const targetRgb = hexToRgb(targetHex);
  if (!targetRgb) return [];

  const threadsWithDistance = threads.map(thread => {
    const threadHex = thread.Hex;
    const threadRgb = hexToRgb(threadHex);
    if (!threadRgb) return null;
    const distance = colourDistance(targetRgb.r, targetRgb.g, targetRgb.b, threadRgb.r, threadRgb.g, threadRgb.b);
    return { thread, distance };
  }).filter(item => item !== null);

  // Sort by distance
  threadsWithDistance.sort((a, b) => a.distance - b.distance);

  // Select top numClosest
  const closest = threadsWithDistance.slice(0, numClosest).map(item => item.thread);

  return closest;
}

/**
 * Get an approximate spool colour from the spool image. (Same as before)
 */
async function getImageDominantColor(url) {
  // ... (rest of getImageDominantColor function - no changes) ...
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    // Build proxied spool URL so the browser is allowed to read pixels
    const absolute = `https://shop.madeira.co.uk${url}`;
    const encoded = encodeURIComponent(absolute);
    const finalUrl = `/proxy/${encoded}`;

    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Sample centre area
      const centerX = Math.floor(img.width / 2);
      const centerY = Math.floor(img.height / 2);
      const sampleSize = 10;

      const imageData = ctx.getImageData(
        centerX - Math.floor(sampleSize / 2),
        centerY - Math.floor(sampleSize / 2),
        sampleSize,
        sampleSize
      ).data;

      let r = 0, g = 0, b = 0;
      for(let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
      }
      const total = imageData.length / 4;
      resolve({
        r: Math.round(r / total),
        g: Math.round(g / total),
        b: Math.round(b / total)
      });
    };

    img.onerror = () => {
      // If it fails, return a neutral colour
      resolve({ r: 128, g: 128, b: 128 });
    };

    img.src = finalUrl;
  });
}

/*******************************************************
 * 14. Display Madeira Search Results by Pantone (Same as before)
 *******************************************************/
async function displayMadeiraResultsByPantone(resultsMap) {
  // ... (rest of displayMadeiraResultsByPantone function - no changes) ...
      // Remove existing Madeira results if present to avoid duplication
  const existingMadeira = document.getElementById("madeiraResults");
  if (existingMadeira) {
    existingMadeira.remove();
  }

  // Create a new container for Madeira results
  const madeiraContainer = document.createElement("div");
  madeiraContainer.id = "madeiraResults";

  // Initialize HTML content with a heading
  let html = `<h2>Madeira Search Results by Pantone</h2>`;

  // Iterate over each Pantone code in the results map
  for (const pantone of Object.keys(resultsMap)) {
    const productArray = resultsMap[pantone];

    html += `<h3>${pantone}</h3>`;

    // Handle cases where no products are found for a Pantone
    if (!productArray || !productArray.length) {
      html += `<p>No results found.</p>`;
      continue;
    }

    // Retrieve the Pantone RGB values from the loaded pantoneData
    const pantoneObj = pantoneData.find(p => p.code.toLowerCase() === pantone.toLowerCase());
    if (!pantoneObj) {
      html += `<p>Unknown Pantone in local dataset.</p>`;
      continue;
    }

    const originalRgb = { r: pantoneObj.r, g: pantoneObj.g, b: pantoneObj.b };

    // Enhance each product with spool RGB and match score
    const enhanced = await Promise.all(productArray.map(async prod => {
      let spoolRgb = null;
      let score = 0;
      if (prod.imageUrl) {
        spoolRgb = await getImageDominantColor(prod.imageUrl);
        score = calculateColorMatchScore(originalRgb, spoolRgb);
      }
      return {
        ...prod,
        spoolRgb,
        score
      };
    }));

    // Group the enhanced array by Colour ID
    const colourIdMap = {}; // { colorId: { hex, score, imageUrl, descriptions: [] } }
    enhanced.forEach(item => {
      if (!item.colorId) return; // Skip if no Colour ID

      // If Colour ID is not yet in the map or current item has a higher score, update the entry
      if (!colourIdMap[item.colorId] || item.score > colourIdMap[item.colorId].score) {
        colourIdMap[item.colorId] = {
          hex: item.hex,
          score: item.score,
          imageUrl: item.imageUrl,
          descriptions: [item.productName || 'No Description']
        };
      } else if (item.score === colourIdMap[item.colorId].score) {
        // If the score is the same, append the description if it's unique
        if (item.productName && !colourIdMap[item.colorId].descriptions.includes(item.productName)) {
          colourIdMap[item.colorId].descriptions.push(item.productName);
        }
      }
    });

    // Convert the colourIdMap to an array for sorting
    const uniqueColours = Object.keys(colourIdMap).map(colorId => ({
      colorId,
      hex: colourIdMap[colorId].hex,
      score: colourIdMap[colorId].score,
      imageUrl: colourIdMap[colorId].imageUrl,
      descriptions: colourIdMap[colorId].descriptions
    }));

    // Handle cases where no unique colours are found
    if (!uniqueColours.length) {
      html += `<p>No unique spool images found to match this Pantone.</p>`;
      continue;
    }

    // Sort the unique colours by descending score (highest match first)
    uniqueColours.sort((a, b) => b.score - a.score);

    // Select the top two unique Colour IDs
    const topTwoUnique = uniqueColours.slice(0, 2);

    // Handle cases where less than two unique colours are available
    if (!topTwoUnique.length) {
      html += `<p>No spool images found to match this Pantone.</p>`;
      continue;
    }

    // Build the list of top two unique matching Colour IDs
    for (const colour of topTwoUnique) {
      html +=
        `<div class="madeira-result">
          <div class="madeira-product">
            ${
              colour.imageUrl
                ? `<img src="/proxy/${encodeURIComponent("https://shop.madeira.co.uk" + colour.imageUrl)}" alt="${colour.descriptions.join(', ') || 'Unnamed Thread'}" crossOrigin="Anonymous" class="madeira-thread-image" />`
                : ''
            }
            <div class="madeira-details">
              <p><strong>Colour ID:</strong> ${colour.colorId}</p>
              <p><strong>Match Score:</strong> ${colour.score}%</p>
              <p><strong>Descriptions:</strong></p>
              <ul>
                ${colour.descriptions.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="thread-matches">`;

      // Now, find the hex code from madeiraThreadsData
      // Assuming colour.colorId corresponds to "ThreadNumber" in madeiraThreadsData
      const colourId = parseInt(colour.colorId, 10);
      const madeiraThread = madeiraThreadsData.find(mt => mt.ThreadNumber === colourId);

      if (madeiraThread && madeiraThread.HexCode) {
        const targetHex = madeiraThread.HexCode;
        // Find the closest two threads in threadsData
        const closestThreads = findClosestThreads(targetHex, threadsData, 2);

        if (closestThreads.length > 0) {
          // Check if any of the closest threads is an exact match
          const exactMatches = closestThreads.filter(thread => thread["Thread Number"] === colourId.toString());
          const similarThreads = closestThreads.filter(thread => thread["Thread Number"] !== colourId.toString());

          if (exactMatches.length > 0) {
            html += `<div class="thread-match-section"><h4 class="exact-match-header">Exact Match in Stock:</h4><ul class="closest-thread-list">`;
            exactMatches.forEach(thread => {
              html +=
                `<li class="closest-thread-item">
                  <div class="thread-hex" style="background:${thread.Hex};"></div>
                  <div class="thread-info">
                    <strong>Thread Number:</strong> ${thread["Thread Number"]}<br>
                    <strong>Stock Quantity:</strong> ${thread["Colours"] && thread["Colours"]["Stock Quantity"] ? thread["Colours"]["Stock Quantity"] : 'N/A'}
                  </div>
                </li>`;
            });
            html += `</ul></div>`;
          }

          if (similarThreads.length > 0) {
            html += `<div class="thread-match-section"><h4 class="similar-match-header">Similar Threads in Stock:</h4><ul class="closest-thread-list">`;
            similarThreads.forEach(thread => {
              html +=
                `<li class="closest-thread-item">
                  <div class="thread-hex" style="background:${thread.Hex};"></div>
                  <div class="thread-info">
                    <strong>Thread Number:</strong> ${thread["Thread Number"]}<br>
                    <strong>Stock Quantity:</strong> ${thread["Colours"] && thread["Colours"]["Stock Quantity"] ? thread["Colours"]["Stock Quantity"] : 'N/A'}
                  </div>
                </li>`;
            });
            html += `</ul></div>`;
          }
        } else {
          html += `<p>No similar threads found in stock.</p>`;
        }
      } else {
        html += `<p>Colour ID not found in Madeira threads data.</p>`;
      }

      html +=
          `</div>
        </div>`;// REMOVED DIVIDER HERE
    }
  }

  // Set the innerHTML of the Madeira container
  madeiraContainer.innerHTML = html;

  // Append the Madeira results to the right-column after #selectedForThread
  const rightColumn = document.querySelector(".right-column");
  const threadSection = document.getElementById("selectedForThread");
  if (threadSection.nextSibling) {
    rightColumn.insertBefore(madeiraContainer, threadSection.nextSibling);
  } else {
    rightColumn.appendChild(madeiraContainer);
  }
}

/*******************************************************
 * 15. Hex-Based Madeira Search Functions (Same as before)
 *******************************************************/

/**
 * Search Madeira Threads by Pantone (Same as before)
 */
async function searchMadeiraThreadsByPantone(pantoneArray) {
  // ... (rest of searchMadeiraThreadsByPantone function - no changes) ...
      const results = {};

  for (const pantoneCode of pantoneArray) {
    const pantoneObj = pantoneData.find(p => p.code.toLowerCase() === pantoneCode.toLowerCase());
    if (!pantoneObj) {
      console.warn(`Pantone code not found: ${pantoneCode}`);
      results[pantoneCode] = [];
      continue;
    }
    const targetRgb = { r: pantoneObj.r, g: pantoneObj.g, b: pantoneObj.b };

    // Find the closest products based on Euclidean RGB distance
    const closestProducts = findClosestMadeiraProductsByPantone(targetRgb, madeiraThreadsData, 2);
    results[pantoneCode] = closestProducts;
  }

  return results;
}

/**
 * Find Closest Madeira Products by Pantone (Same as before)
 */
function findClosestMadeiraProductsByPantone(targetRgb, products, numClosest = 2) {
  // ... (rest of findClosestMadeiraProductsByPantone function - no changes) ...
      const productsWithDistance = products.map(product => {
    const productHex = product.HexCode;
    const productRgb = hexToRgb(productHex);
    if (!productRgb) return null;

    const distance = colourDistance(targetRgb.r, targetRgb.g, targetRgb.b, productRgb.r, productRgb.g, productRgb.b);
    const score = calculateColorMatchScore(targetRgb, productRgb);

    return { product, distance, score };
  }).filter(item => item !== null);

  // Sort by distance (ascending)
  productsWithDistance.sort((a, b) => a.distance - b.distance);

  // Select top numClosest
  const closest = productsWithDistance.slice(0, numClosest).map(item => ({
    product: item.product,
    distance: item.distance,
    score: item.score
  }));

  return closest;
}


/**
 * Search Madeira Threads by Hex (Same as before)
 */
async function searchMadeiraThreadsByHex(hexArray) {
  // ... (rest of searchMadeiraThreadsByHex function - no changes) ...
      const results = {};

  for (const hex of hexArray) {
    const targetRgb = hexToRgb(hex);
    if (!targetRgb) {
      console.warn(`Invalid hex code: ${hex}`);
      results[hex] = [];
      continue;
    }

    // Find the closest threads based on Euclidean RGB distance
    const closestThreads = findClosestThreadsByHex(targetRgb, madeiraThreadsData, 2);

    results[hex] = closestThreads;
  }

  return results;
}

/**
 * Find Closest Threads by Hex (Same as before)
 */
function findClosestThreadsByHex(targetRgb, threads, numClosest = 2) {
  // ... (rest of findClosestThreadsByHex function - no changes) ...
      const threadsWithDistance = threads.map(thread => {
    const threadHex = thread.HexCode;
    const threadRgb = hexToRgb(threadHex);
    if (!threadRgb) return null;

    const distance = colourDistance(targetRgb.r, targetRgb.g, targetRgb.b, threadRgb.r, threadRgb.g, threadRgb.b);
    const score = calculateColorMatchScore(targetRgb, threadRgb);

    return { thread, distance, score };
  }).filter(item => item !== null);

  // Sort by distance (ascending)
  threadsWithDistance.sort((a, b) => a.distance - b.distance);

  // Select top numClosest
  const closest = threadsWithDistance.slice(0, numClosest).map(item => ({
    thread: item.thread,
    distance: item.distance,
    score: item.score
  }));

  return closest;
}

/*******************************************************
   * 16. Display Madeira Search Results by Hex (Updated for Colour Mode)
   *******************************************************/
  /**
   * Display Madeira Search Results by Hex
   * @param {Object} resultsMap - Mapping of hex codes to their closest thread matches.
   */
 async function displayMadeiraResultsByHex(resultsMap) {
        // Remove existing Madeira Hex results if present to avoid duplication
        const existingMadeiraHex = document.getElementById("madeiraResultsHex");
        if (existingMadeiraHex) {
          existingMadeiraHex.remove();
        }

    // Create a new container for Madeira results by Hex
    const madeiraContainer = document.createElement("div");
    madeiraContainer.id = "madeiraResultsHex";

    // Initialize HTML content with a heading
    let html = `<h2>Madeira Search Results by Hex</h2>`;

    // Iterate over each hex code in the results map
    for (const hex of Object.keys(resultsMap)) {
        const threadArray = resultsMap[hex];

        html += `<h3>${hex}</h3>`;

        // Handle cases where no threads are found for a hex
        if (!threadArray || !threadArray.length) {
            html += `<p>No matching threads found.</p>`;
          continue;
        }

        const processedThreads = await processMadeiraThreads(threadArray, hex);

      // Handle cases where no unique threads are found
        if (!processedThreads.length) {
          html += `<p>No unique matching threads found.</p>`;
            continue;
        }


          // Display each thread match
       for (const result of processedThreads) {
           const { thread, distance, score, hexCode } = result;

              html +=
              `<div class="madeira-result">
                  <div class="madeira-product">
                    ${
                      thread.ImageURL
                        ? `<img src="/proxy/${encodeURIComponent(thread.ImageURL)}" alt="Thread Image" class="madeira-thread-image" />`
                        : `<div class="no-image">No Image Available</div>`
                    }
                      <div class="madeira-details">
                          <p><strong>Thread Number:</strong> ${thread.ThreadNumber || 'N/A'}</p>
                         <p><strong>Match Score:</strong> ${score}%</p>
                          <p><strong>Hex Code:</strong> <span class="hex-display" style="background:${hexCode};"></span> ${hexCode}</p>
                     </div>
                </div>
                <div class="thread-matches">`;


          // Find closest matches from threadData (our stock)
          const closestThreads = findClosestThreads(hexCode, threadsData, 2);

             // Check if any of the closest threads is an exact match to the Madeira Thread Number (Colour Id).
            const exactMatches = closestThreads.filter(stockThread => stockThread["Thread Number"] === thread.ThreadNumber.toString());
            const similarThreads = closestThreads.filter(stockThread => stockThread["Thread Number"] !== thread.ThreadNumber.toString());

                if (exactMatches.length > 0) {
                   html += `<div class="thread-match-section"><h4 class="exact-match-header">Exact Match in Stock:</h4><ul class="closest-thread-list">`;
                    exactMatches.forEach(match => {
                      const stockQuantity = getStockQuantity(match["Thread Number"]);
                        html +=
                        `<li class="closest-thread-item">
                            <div class="thread-hex" style="background:${match.Hex};"></div>
                            <div class="thread-info">
                            <strong>Thread Number:</strong> ${match["Thread Number"]}<br>
                             <strong>Stock:</strong> ${stockQuantity !== 'N/A' ? stockQuantity : '<span style="color: red;">Out of Stock</span>'}
                            </div>
                        </li>`;
                    });
                   html += `</ul></div>`;
              }

            if (similarThreads.length > 0) {
                html += `<div class="thread-match-section"><h4 class="similar-match-header">Similar Threads in Stock:</h4><ul class="closest-thread-list">`;
                 similarThreads.forEach(match => {
                     const stockQuantity = getStockQuantity(match["Thread Number"]);
                     html +=
                      `<li class="closest-thread-item">
                        <div class="thread-hex" style="background:${match.Hex};"></div>
                        <div class="thread-info">
                           <strong>Thread Number:</strong> ${match["Thread Number"]}<br>
                            <strong>Stock:</strong> ${stockQuantity !== 'N/A' ? stockQuantity : '<span style="color: red;">Out of Stock</span>'}
                        </div>
                     </li>`;
                   });
               html += `</ul></div>`;
              }
            else {
              html += `<p>No similar threads found in stock.</p>`;
            }

            html +=
                `</div>
          </div>
         `; // REMOVED DIVIDER HERE
       }
    }

      // Set the innerHTML of the Madeira container
        madeiraContainer.innerHTML = html;

        // Append the Madeira results by Hex to the right-column after #selectedForThread
    const rightColumn = document.querySelector(".right-column");
    const threadSection = document.getElementById("selectedForThread");
        if (threadSection.nextSibling) {
            rightColumn.insertBefore(madeiraContainer, threadSection.nextSibling);
       } else {
          rightColumn.appendChild(madeiraContainer);
        }
  }


     /**
      * Helper Function to Process Madeira Threads (Same as before)
      */
      async function processMadeiraThreads(threadArray, hex) {
        // 1. Filter for unique threads, by Thread Number
         const uniqueThreads = {};

        threadArray.forEach(match => {
          const thread = match.thread;
            if (!uniqueThreads[thread.ThreadNumber]) {
              uniqueThreads[thread.ThreadNumber] = {
                  thread,
                  distance: match.distance,
                 score: match.score
            };
            }
          });

        const uniqueArray = Object.values(uniqueThreads);


      // 2. Get the first (or default) Image URL and Stock
        const results = await Promise.all(uniqueArray.map(async match => {
          const thread = match.thread;
            // Attempt to get a matching record from madeiraThreads data
           const threadFromData = madeiraThreadsData.find(mt => mt.ThreadNumber === thread.ThreadNumber);
           let primaryImageUrl = null;
            let threadHex = null
            if(threadFromData) {
                primaryImageUrl = threadFromData.ImageURL;
              threadHex = threadFromData.HexCode;
            } else {
                 debugLog(`No image found for Madeira thread with ThreadNumber`, thread.ThreadNumber)
            }

             return {
               thread: { ...thread, ImageURL: primaryImageUrl },
                distance: match.distance,
                score: match.score,
                hexCode: threadHex
            };
      }));

        // 3. Sort the threads by match score descending.
        results.sort((a,b) => b.score - a.score)
        return results.slice(0,2) // limit to two threads
      }

    /**
      * Helper function to determine if a thread is in stock based on thread number. (Same as before)
      */
    function getStockQuantity(threadNumber) {
          const threadStr = threadNumber.toString();
         const correspondingThread = threadsData.find(t => t["Thread Number"] === threadStr);
          if (correspondingThread && correspondingThread.Colours && correspondingThread.Colours["Stock Quantity"]) {
            return correspondingThread.Colours["Stock Quantity"];
           }
         return 'N/A';
    }

/*******************************************************
 * 17. Additional Helper Functions for Hex-Based Search (Updated for Colour Mode)
 *******************************************************/

/**
 * Search Madeira Threads by Hex (Updated for Colour Mode)
 */
async function searchMadeiraThreadsByHex(hexArray) {
  const results = {};
  const madeiraSearchMode = getMadeiraHexSearchMode(); // Get selected mode

  for (const hex of hexArray) {
    const targetRgb = hexToRgb(hex);
    if (!targetRgb) {
      console.warn(`Invalid hex code: ${hex}`);
      results[hex] = [];
      continue;
    }

    // Find the closest threads based on selected colour mode
    const closestThreads = findClosestThreadsByHex(targetRgb, madeiraThreadsData, 2, madeiraSearchMode); // Pass mode

    results[hex] = closestThreads;
  }

  return results;
}

/**
 * Find Closest Threads by Hex (Updated for Colour Mode)
 */
function findClosestThreadsByHex(targetRgb, threads, numClosest = 2, searchMode = 'rgb') { // Add searchMode param
  const threadsWithDistance = threads.map(thread => {
    const threadHex = thread.HexCode;
    const threadRgb = hexToRgb(threadHex);
    if (!threadRgb) return null;

    let distance;
    if (searchMode === 'cielab') {
      const lab1 = rgbToLab(targetRgb.r, targetRgb.g, targetRgb.b);
      const lab2 = rgbToLab(threadRgb.r, threadRgb.g, threadRgb.b);
      distance = cie76Distance(lab1, lab2); // CIELab distance
    } else {
      distance = colourDistance(targetRgb.r, targetRgb.g, targetRgb.b, threadRgb.r, threadRgb.g, threadRgb.b); // RGB distance
    }
    const score = calculateColorMatchScore(targetRgb, threadRgb);

    return { thread, distance, score };
  }).filter(item => item !== null);

  // Sort by distance (ascending)
  threadsWithDistance.sort((a, b) => a.distance - b.distance);

  // Select top numClosest
  const closest = threadsWithDistance.slice(0, numClosest).map(item => ({
    thread: item.thread,
    distance: item.distance,
    score: item.score
  }));

  return closest;
}

/**
 * Helper function to get selected Madeira Hex search mode
 */
function getMadeiraHexSearchMode() {
  const selectedRadio = document.querySelector('input[name="madeiraHexSearchType"]:checked');
  return selectedRadio ? selectedRadio.value : 'rgb'; // Default to 'rgb' if nothing selected
}
/*******************************************************
 * 18. Additional Helper Functions (Same as before)
 *******************************************************/

/**
 * Calculate Euclidean distance between two RGB colours. (Same as before)
 */
function colourDistance(r1, g1, b1, r2, g2, b2) {
  // ... (rest of colourDistance function - no changes) ...
  return Math.sqrt(
    (r1 - r2)**2 +
    (g1 - g2)**2 +
    (b1 - b2)**2
  );
}

/**
 * Convert hex to HSL, return hue (0..360). (Same as before)
 */
function getHue(hex) {
  // ... (rest of getHue function - no changes) ...
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  let { r, g, b } = rgb;
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return h;
}


/*******************************************************
 * 19. State Persistence Functions (Using localStorage) - SOLUTION G (Save & Restore Canvas)
 *******************************************************/

/**
 * Save the current state of the home page to localStorage.
 */
function saveHomePageState() {
  const madeiraResultsElPantone = document.getElementById("madeiraResults");
  const madeiraResultsElHex = document.getElementById("madeiraResultsHex");

  const state = {
    imageSrc: uploadedImage.src,
    resultsHTML: resultsDiv.innerHTML,
    manualColourListHTML: manualColourList.innerHTML,
    threadListHTML: threadList.innerHTML,
    colourMode: colourMode,
    madeiraResultsPantoneHTML: madeiraResultsElPantone ? madeiraResultsElPantone.innerHTML : '',
    madeiraResultsHexHTML: madeiraResultsElHex ? madeiraResultsElHex.innerHTML : '',
    canvasData: hiddenCanvas.toDataURL() // SOLUTION G: SAVE CANVAS DATA AS DATA URL
  };
  localStorage.setItem('homePageState', JSON.stringify(state));
  console.log('Home page state SAVED to localStorage (including canvas).', Object.keys(state)); // Log saved state
}

/**
 * Restore the home page state from localStorage.
 */
function restoreHomePageState() {
  const storedState = localStorage.getItem('homePageState');
  if (storedState) {
    const state = JSON.parse(storedState);
    console.log('Home page state RESTORED from localStorage (including canvas).', Object.keys(state));

    const imageContainer = document.getElementById("imageContainer");

    // Restore image (Same as Solution F)
    if (state.imageSrc && state.imageSrc.startsWith('data:image')) {
      uploadedImage.src = "";

      uploadedImage.onload = () => {
        console.log('Uploaded image reloaded successfully via FileReader.');
      };
      uploadedImage.onerror = (error) => {
        console.error('FileReader error loading image:', error);
      };

      uploadedImage.style.display = 'block';
      uploadedImage.style.maxWidth = '100%';
      uploadedImage.style.maxHeight = '500px';
      uploadedImage.style.height = 'auto';
      uploadedImage.style.border = '1px solid #ccc';
      uploadedImage.style.margin = '0 auto';
      uploadedImage.style.borderRadius = '6px';
      imageContainer.style.display = 'block';

      uploadedImage.src = state.imageSrc;

    } else {
      console.warn('No valid image source Data URL found in saved state.');
      imageContainer.style.display = 'none';
    }

    // SOLUTION G: RESTORE CANVAS CONTENT
    if (state.canvasData) {
      const imgForCanvas = new Image();
      imgForCanvas.onload = () => {
        ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height); // Clear canvas before drawing
        hiddenCanvas.width = imgForCanvas.width;  // Ensure canvas dimensions match image
        hiddenCanvas.height = imgForCanvas.height;
        ctx.drawImage(imgForCanvas, 0, 0); // Draw restored image to canvas
        console.log('Hidden canvas state reloaded from Data URL.');
      };
      imgForCanvas.onerror = (error) => {
        console.error('Error loading canvas image from Data URL:', error);
      };
      imgForCanvas.src = state.canvasData; // Set src to trigger onload
    }


    resultsDiv.innerHTML = state.resultsHTML;
    manualColourList.innerHTML = state.manualColourListHTML;
    threadList.innerHTML = state.threadListHTML;
    colourMode = state.colourMode;

    // Restore Madeira results sections (Same as before)
    if (state.madeiraResultsPantoneHTML) {
      const madeiraContainerPantone = document.createElement("div");
      madeiraContainerPantone.id = "madeiraResults";
      madeiraContainerPantone.innerHTML = state.madeiraResultsPantoneHTML;
      const rightColumn = document.querySelector(".right-column");
      const threadSection = document.getElementById("selectedForThread");
      if (threadSection.nextSibling) {
        rightColumn.insertBefore(madeiraContainerPantone, threadSection.nextSibling);
      } else {
        rightColumn.appendChild(madeiraContainerPantone);
      }
    }
     if (state.madeiraResultsHexHTML) {
      const madeiraContainerHex = document.createElement("div");
      madeiraContainerHex.id = "madeiraResultsHex";
      madeiraContainerHex.innerHTML = state.madeiraResultsHexHTML;
      const rightColumn = document.querySelector(".right-column");
      const threadSection = document.getElementById("selectedForThread");
      if (threadSection.nextSibling) {
        rightColumn.insertBefore(madeiraContainerHex, threadSection.nextSibling);
      } else {
        rightColumn.appendChild(madeiraContainerHex);
      }
    }


    // Update the radio button for colour mode to reflect loaded state
    const colourModeRadio = document.querySelector(`input[name="colourSearchType"][value="${colourMode}"]`);
    if (colourModeRadio) {
      colourModeRadio.checked = true;
    }

    console.log('Home page state restored from localStorage.');
    localStorage.removeItem('homePageState'); // Clear state after restoring
  } else {
    console.log('No home page state found in localStorage.');
    document.getElementById("imageContainer").style.display = 'none'; // Ensure container is hidden if no saved state
  }
}

/**
 * Helper function to convert Data URL to Blob (Same as before)
 */
function dataURLtoBlob(dataURL) {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

// Call restore function on page load (Same as before)
window.addEventListener('load', restoreHomePageState);

// Call save function before navigating away from home page (Same as before)
document.addEventListener('DOMContentLoaded', () => {
  const threadsLink = document.querySelector('nav a[href="threads.html"]'); // Adjust selector if needed
  if (threadsLink) {
    threadsLink.addEventListener('click', saveHomePageState);
  }
});

/**
 * Helper function to convert Data URL to Blob (Same as before)
 */
function dataURLtoBlob(dataURL) {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

// ... (rest of your script.js - all functions after this) ...

/*******************************************************
 * 20. Function to Re-analyse Colours
 *******************************************************/

/*******************************************************
 * 20. Function to Re-analyse Colours - DEBUGGING LOGS ADDED
 *******************************************************/

/*******************************************************
 * 20. Function to Re-analyse Colours - WITH SWELL ANIMATION
 *******************************************************/

function reAnalyseColours() {
  console.log('reAnalyseColours() called in script.js - START');

  if (!uploadedImage.src) {
    console.warn("No image uploaded to re-analyse.");
    resultsDiv.innerHTML = "<p>No image to analyse. Upload an image first.</p>";
    console.log('reAnalyseColours() - No image, aborted.');
    return;
  }

  const width = hiddenCanvas.width;
  const height = hiddenCanvas.height;
  console.log(`reAnalyseColours() - Canvas Dimensions: width=${width}, height=${height}`);

  if (width <= 0 || height <= 0) {
    console.warn("Canvas dimensions are invalid. Re-analysis aborted.");
    resultsDiv.innerHTML = "<p>Cannot re-analyse: Image dimensions invalid.</p>";
    console.log('reAnalyseColours() - Invalid dimensions, aborted.');
    return;
  }

  // Add 'swell' class to trigger animation
  resultsDiv.classList.add('results-panel-swell'); // Add class HERE

  console.log('reAnalyseColours() - Calling getDistinctColoursFromCanvas...');
  const distinctColours = getDistinctColoursFromCanvas(ctx, width, height);
  console.log('reAnalyseColours() - getDistinctColoursFromCanvas returned:', distinctColours);

  console.log('reAnalyseColours() - Calling displayResults...');
  displayResults(distinctColours);

  // Remove 'swell' class after a short delay to allow animation to play
  setTimeout(() => {
    resultsDiv.classList.remove('results-panel-swell'); // Remove class HERE with delay
  }, 300); // 300ms delay (adjust as needed)

  console.log('reAnalyseColours() - displayResults completed.');
  console.log('reAnalyseColours() - END');
}