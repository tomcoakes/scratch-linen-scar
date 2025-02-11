// updateThreadColours.js

const fs = require('fs');
const path = require('path');

const threadsPath = path.join(__dirname, 'threads.json');

const colorMap = {
    '#FF0000': { category: 'Red', variation: 'Medium Red', searchTerms: ['Medium Red', 'Red', 'Crimson', 'Ruby', 'Cherry', 'Vermilion', 'Scarlet', 'Cardinal'] },
    '#C00000': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot'] },
    '#FFB300': { category: 'Yellow', variation: 'Medium Yellow', searchTerms: ['Medium Yellow', 'Yellow', 'Gold', 'Amber', 'Honey', 'Mustard', 'Topaz', 'Citrine'] },
    '#E0004C': { category: 'Purple/Pink', variation: 'Dark Pink/Purple', searchTerms: ['Dark Pink', 'Dark Purple', 'Plum', 'Violet', 'Grape', 'Amethyst', 'Eggplant', 'Magenta'] },
    '#007080': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal'] },
    '#008840': { category: 'Green', variation: 'Dark Green', searchTerms: ['Dark Green', 'Forest Green', 'Pine', 'Hunter', 'Malachite', 'Evergreen', 'Jungle'] },
    '#897A27': { category: 'Yellow/Brown', variation: 'Dark Yellow', searchTerms: ['Dark Yellow', 'Ochre', 'Brass', 'Goldenrod', 'Bronze', 'Umber', 'Sienna'] },
    '#F5E1A4': { category: 'Yellow', variation: 'Light Yellow', searchTerms: [ 'Light Yellow', 'Pale Yellow', 'Cream', 'Ivory', 'Vanilla', 'Butter', 'Champagne' ] },
    '#000000': { category: 'Grey/Black', variation: 'Dark Gray/Black', searchTerms: [ 'Dark Grey', 'Black', 'Obsidian', 'Charcoal', 'Graphite', 'Lead', 'Onyx', 'Ebony'] },
    '#A9793B': { category: 'Brown', variation: 'Light Brown', searchTerms: ['Light Brown', 'Beige', 'Tan', 'Khaki', 'Sand', 'Fawn', 'Oatmeal', 'Ecru'] },
     '#A4A9B6': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
      '#A7A9B6': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
     '#857F74': { category: 'Brown', variation: 'Medium Brown', searchTerms: ['Medium Brown', 'Brown', 'Chocolate', 'Coffee', 'Sienna', 'Umber', 'Cocoa', 'Nutmeg', 'Caramel'] },
    '#808293': { category: 'Blue', variation: 'Medium Blue', searchTerms: ['Medium Blue', 'Blue', 'Azure', 'Sapphire', 'Teal', 'Cerulean', 'Sky', 'Ocean'] },
     '#B6BAC6': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
    '#B2B2B2': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
     '#C00000': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot'] },
    '#171C18': { category: 'Grey/Black', variation: 'Dark Gray/Black', searchTerms: [ 'Dark Grey', 'Black', 'Obsidian', 'Charcoal', 'Graphite', 'Lead', 'Onyx', 'Ebony'] },
     '#FFFFFF': { category: 'Grey', variation: 'Light Grey', searchTerms: ['Light Grey', 'Silver', 'Smoke', 'Mist', 'Pearl', 'Cloud', 'Ghost'] },
      '#F6EB63': { category: 'Yellow', variation: 'Medium Yellow', searchTerms: ['Medium Yellow', 'Yellow', 'Gold', 'Amber', 'Honey', 'Mustard', 'Topaz', 'Citrine'] },
      '#FFB5AC': { category: 'Red', variation: 'Light Red', searchTerms: ['Light Red', 'Pink', 'Rose', 'Salmon', 'Coral', 'Blush', 'Peach', 'Apricot'] },
       '#A22137': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot'] },
     '#004A89': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal']},
      '#0047BB': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal']},
    '#A8ACB8': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
    '#009946': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
     '#105193': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal']},
     '#006A84': { category: 'Blue', variation: 'Medium Blue', searchTerms: ['Medium Blue', 'Blue', 'Azure', 'Sapphire', 'Teal', 'Cerulean', 'Sky', 'Ocean'] },
    '#A25EB5': { category: 'Purple/Pink', variation: 'Medium Pink/Purple', searchTerms: ['Medium Pink', 'Medium Purple', 'Magenta', 'Orchid', 'Rose Pink', 'Fuchsia', 'Carnation', 'Raspberry'] },
       '#A22137': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot'] },
      '#6E3629': { category: 'Brown', variation: 'Dark Brown', searchTerms: ['Dark Brown', 'Espresso', 'Mahogany', 'Charcoal', 'Cocoa', 'Coffee Bean', 'Truffle'] },
      '#000000': { category: 'Grey/Black', variation: 'Dark Gray/Black', searchTerms: [ 'Dark Grey', 'Black', 'Obsidian', 'Charcoal', 'Graphite', 'Lead', 'Onyx', 'Ebony' ] },
      '#A65A29': { category: 'Orange', variation: 'Medium Orange', searchTerms: ['Medium Orange', 'Orange', 'Coral', 'Amber', 'Tangerine', 'Pumpkin', 'Marigold'] },
       '#4B302A': { category: 'Brown', variation: 'Dark Brown', searchTerms: ['Dark Brown', 'Espresso', 'Mahogany', 'Charcoal', 'Cocoa', 'Coffee Bean', 'Truffle']},
     '#3F2A2F': { category: 'Brown', variation: 'Dark Brown', searchTerms: ['Dark Brown', 'Espresso', 'Mahogany', 'Charcoal', 'Cocoa', 'Coffee Bean', 'Truffle'] },
    '#E01682': { category: 'Purple/Pink', variation: 'Dark Pink/Purple', searchTerms: ['Dark Pink', 'Dark Purple', 'Plum', 'Violet', 'Grape', 'Amethyst', 'Eggplant', 'Magenta'] },
       '#A22137': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot'] },
         '#004E5A': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal']},
       '#7BDCD5': { category: 'Green', variation: 'Light Green', searchTerms: ['Light Green', 'Mint', 'Lime', 'Pale Green', 'Seafoam', 'Celadon', 'Chartreuse', 'Aquamarine']},
    '#A1A3B0': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
        '#007A41': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
           '#F8DBE0': { category: 'Red', variation: 'Light Red', searchTerms: ['Light Red', 'Pink', 'Rose', 'Salmon', 'Coral', 'Blush', 'Peach', 'Apricot'] },
           '#0091B4': { category: 'Blue', variation: 'Medium Blue', searchTerms: ['Medium Blue', 'Blue', 'Azure', 'Sapphire', 'Teal', 'Cerulean', 'Sky', 'Ocean'] },
      '#72308A': { category: 'Purple/Pink', variation: 'Medium Pink/Purple', searchTerms: ['Medium Pink', 'Medium Purple', 'Magenta', 'Orchid', 'Rose Pink', 'Fuchsia', 'Carnation', 'Raspberry'] },
       '#326195': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal']},
        '#01B552': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
         '#009460': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
           '#64656A': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
      '#FF7101': { category: 'Orange', variation: 'Medium Orange', searchTerms: ['Medium Orange', 'Orange', 'Coral', 'Amber', 'Tangerine', 'Pumpkin', 'Marigold']},
     '#0191B4': { category: 'Blue', variation: 'Medium Blue', searchTerms: ['Medium Blue', 'Blue', 'Azure', 'Sapphire', 'Teal', 'Cerulean', 'Sky', 'Ocean'] },
       '#00B080': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
        '#FFD0A0': { category: 'Brown', variation: 'Light Brown', searchTerms: ['Light Brown', 'Beige', 'Tan', 'Khaki', 'Sand', 'Fawn', 'Oatmeal', 'Ecru'] },
         '#FE5200': { category: 'Orange', variation: 'Medium Orange', searchTerms: ['Medium Orange', 'Orange', 'Coral', 'Amber', 'Tangerine', 'Pumpkin', 'Marigold'] },
         '#FFFFC3': { category: 'Yellow', variation: 'Light Yellow', searchTerms: ['Light Yellow', 'Pale Yellow', 'Cream', 'Ivory', 'Vanilla', 'Butter', 'Champagne']},
         '#F8DBE0': { category: 'Red', variation: 'Light Red', searchTerms: ['Light Red', 'Pink', 'Rose', 'Salmon', 'Coral', 'Blush', 'Peach', 'Apricot'] },
         '#FCA4BC': { category: 'Red', variation: 'Light Red', searchTerms: ['Light Red', 'Pink', 'Rose', 'Salmon', 'Coral', 'Blush', 'Peach', 'Apricot'] },
         '#E6437C': { category: 'Purple/Pink', variation: 'Medium Pink/Purple', searchTerms: ['Medium Pink', 'Medium Purple', 'Magenta', 'Orchid', 'Rose Pink', 'Fuchsia', 'Carnation', 'Raspberry'] },
          '#3B8EDE': { category: 'Blue', variation: 'Medium Blue', searchTerms: ['Medium Blue', 'Blue', 'Azure', 'Sapphire', 'Teal', 'Cerulean', 'Sky', 'Ocean'] },
           '#326195': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal']},
          '#009460': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
          '#B3E2D8': { category: 'Green', variation: 'Light Green', searchTerms: ['Light Green', 'Mint', 'Lime', 'Pale Green', 'Seafoam', 'Celadon', 'Chartreuse', 'Aquamarine']},
           '#B2B2B2': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
          '#16C1DF': { category: 'Blue', variation: 'Medium Blue', searchTerms: ['Medium Blue', 'Blue', 'Azure', 'Sapphire', 'Teal', 'Cerulean', 'Sky', 'Ocean'] },
            '#171717': { category: 'Grey/Black', variation: 'Dark Gray/Black', searchTerms: [ 'Dark Grey', 'Black', 'Obsidian', 'Charcoal', 'Graphite', 'Lead', 'Onyx', 'Ebony' ] },
             '#001B72': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal']},
        '#172432': { category: 'Grey/Black', variation: 'Dark Gray/Black', searchTerms: [ 'Dark Grey', 'Black', 'Obsidian', 'Charcoal', 'Graphite', 'Lead', 'Onyx', 'Ebony' ] },
        '#009BDE': { category: 'Blue', variation: 'Medium Blue', searchTerms: ['Medium Blue', 'Blue', 'Azure', 'Sapphire', 'Teal', 'Cerulean', 'Sky', 'Ocean'] },
        '#00AEAC': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
         '#665DC6': { category: 'Purple/Pink', variation: 'Medium Pink/Purple', searchTerms: ['Medium Pink', 'Medium Purple', 'Magenta', 'Orchid', 'Rose Pink', 'Fuchsia', 'Carnation', 'Raspberry'] },
          '#F1B9AA': { category: 'Red', variation: 'Light Red', searchTerms: ['Light Red', 'Pink', 'Rose', 'Salmon', 'Coral', 'Blush', 'Peach', 'Apricot'] },
          '#FECE00': { category: 'Yellow', variation: 'Medium Yellow', searchTerms: ['Medium Yellow', 'Yellow', 'Gold', 'Amber', 'Honey', 'Mustard', 'Topaz', 'Citrine'] },
          '#D82930': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot'] },
          '#01B552': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
          '#E6A6A4': { category: 'Red', variation: 'Light Red', searchTerms: ['Light Red', 'Pink', 'Rose', 'Salmon', 'Coral', 'Blush', 'Peach', 'Apricot'] },
        '#005746': { category: 'Green', variation: 'Dark Green', searchTerms: ['Dark Green', 'Forest Green', 'Pine', 'Hunter', 'Malachite', 'Evergreen', 'Jungle'] },
            '#72984B': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
             '#3EAF2C': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
             '#323F48': { category: 'Grey/Black', variation: 'Dark Gray/Black', searchTerms: [ 'Dark Grey', 'Black', 'Obsidian', 'Charcoal', 'Graphite', 'Lead', 'Onyx', 'Ebony'] },
              '#A8B4C8': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
              '#F6343F': { category: 'Red', variation: 'Medium Red', searchTerms: ['Medium Red', 'Red', 'Crimson', 'Ruby', 'Cherry', 'Vermilion', 'Scarlet', 'Cardinal'] },
                '#AF7D58': { category: 'Brown', variation: 'Medium Brown', searchTerms: ['Medium Brown', 'Brown', 'Chocolate', 'Coffee', 'Sienna', 'Umber', 'Cocoa', 'Nutmeg', 'Caramel'] },
                '#FE647E': { category: 'Red', variation: 'Medium Red', searchTerms: ['Medium Red', 'Red', 'Crimson', 'Ruby', 'Cherry', 'Vermilion', 'Scarlet', 'Cardinal'] },
                '#F6E0A6': { category: 'Yellow', variation: 'Medium Yellow', searchTerms: ['Medium Yellow', 'Yellow', 'Gold', 'Amber', 'Honey', 'Mustard', 'Topaz', 'Citrine'] },
                '#694330': { category: 'Brown', variation: 'Dark Brown', searchTerms: ['Dark Brown', 'Espresso', 'Mahogany', 'Charcoal', 'Cocoa', 'Coffee Bean', 'Truffle']},
                '#7A2020': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot']},
                  '#FF6900': { category: 'Orange', variation: 'Medium Orange', searchTerms: ['Medium Orange', 'Orange', 'Coral', 'Amber', 'Tangerine', 'Pumpkin', 'Marigold']},
                    '#962E47': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot']},
                    '#D50158': { category: 'Red', variation: 'Dark Red', searchTerms: ['Dark Red', 'Maroon', 'Burgundy', 'Garnet', 'Brick', 'Oxblood', 'Merlot']},
                    '#FFB2BA': { category: 'Red', variation: 'Light Red', searchTerms: ['Light Red', 'Pink', 'Rose', 'Salmon', 'Coral', 'Blush', 'Peach', 'Apricot']},
                    '#9D6268': { category: 'Purple/Pink', variation: 'Medium Pink/Purple', searchTerms: ['Medium Pink', 'Medium Purple', 'Magenta', 'Orchid', 'Rose Pink', 'Fuchsia', 'Carnation', 'Raspberry']},
                    '#FED2E1': { category: 'Red', variation: 'Light Red', searchTerms: ['Light Red', 'Pink', 'Rose', 'Salmon', 'Coral', 'Blush', 'Peach', 'Apricot']},
                    '#F4B3DD': { category: 'Purple/Pink', variation: 'Light Pink/Purple', searchTerms: ['Light Pink', 'Light Purple', 'Lavender', 'Mauve', 'Lilac', 'Peach', 'Blush'] },
                    '#001B72': { category: 'Blue', variation: 'Dark Blue', searchTerms: ['Dark Blue', 'Navy', 'Indigo', 'Midnight', 'Cobalt', 'Prussian', 'Denim', 'Royal']},
                    '#673278': { category: 'Purple/Pink', variation: 'Dark Pink/Purple', searchTerms: ['Dark Pink', 'Dark Purple', 'Plum', 'Violet', 'Grape', 'Amethyst', 'Eggplant', 'Magenta']},
                    '#F2E4B3': { category: 'Yellow', variation: 'Light Yellow', searchTerms: ['Light Yellow', 'Pale Yellow', 'Cream', 'Ivory', 'Vanilla', 'Butter', 'Champagne']},
                    '#F2D0A0': { category: 'Brown', variation: 'Light Brown', searchTerms: ['Light Brown', 'Beige', 'Tan', 'Khaki', 'Sand', 'Fawn', 'Oatmeal', 'Ecru'] },
                      '#A1A3B0': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
                      '#00837D': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
                      '#00B552': { category: 'Green', variation: 'Medium Green', searchTerms: ['Medium Green', 'Green', 'Emerald', 'Olive', 'Forest', 'Jade', 'Chartreuse', 'Lime', 'Spring Green']},
                    '#A8ACB8': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel']},
                    '#8D8673': { category: 'Grey', variation: 'Medium Grey', searchTerms: ['Medium Grey', 'Grey', 'Steel', 'Slate', 'Cement', 'Pewter', 'Nickel'] },
                     '#999500': { category: 'Yellow/Green', variation: 'Medium Yellow', searchTerms: ['Medium Yellow', 'Yellow', 'Gold', 'Amber', 'Honey', 'Mustard', 'Lime']},
                     '#007172': { category: 'Blue/Green', variation: 'Medium Blue', searchTerms: ['Medium Blue', 'Blue', 'Azure', 'Sapphire', 'Teal', 'Sea', 'Aqua']}

};

// Function to read and parse JSON files
function readJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading or parsing ${path.basename(filePath)}:`, error.message);
        process.exit(1);
    }
}

// Function to write JSON data to file
function writeJSON(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
        console.log(`Successfully updated ${path.basename(filePath)}.`);
    } catch (error) {
        console.error(`Error writing to ${path.basename(filePath)}:`, error.message);
        process.exit(1);
    }
}


/**
 * Calculate Euclidean distance between two RGB colours.
 */
function colourDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    (r1 - r2)**2 +
    (g1 - g2)**2 +
    (b1 - b2)**2
  );
}

function hexToRgb(hex) {
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
 * Find the closest hex colour from the given colorMap
 * @param {string} targetHex - The target hex code.
 * @returns {string} - The closest hex code from our color map.
 */
function findClosestHex(targetHex) {
  const targetRgb = hexToRgb(targetHex);
    if (!targetRgb) return null;
    let minDist = Infinity;
    let nearestHex = null;
    for (const hex in colorMap) {
      const rgb = hexToRgb(hex);
      if(!rgb) continue;
        const dist = colourDistance(targetRgb.r, targetRgb.g, targetRgb.b, rgb.r, rgb.g, rgb.b);
        if (dist < minDist) {
          minDist = dist;
            nearestHex = hex;
      }
    }
  return nearestHex;
}

// Main update function
function updateThreadColours() {
    console.log('Starting colour update process...');

    // Read and parse JSON file
    const threadsData = readJSON(threadsPath);

    let updatedCount = 0;

   threadsData.forEach(thread => {
    const hex = thread.Hex;

      if (hex) {
           const closestHex = findClosestHex(hex);
           if (closestHex && colorMap[closestHex]) {
              const { category, searchTerms } = colorMap[closestHex];

               // check for split categories
              if(category.includes("/")) {
                 const categories = category.split('/');
                 thread.Colours.Colour = categories.join(', ');
                  const allTerms = categories.reduce((acc, cat) => {
                      const catKey = Object.keys(colorMap).find(hexKey => colorMap[hexKey].category === cat);
                        if(catKey){
                           acc.push(...colorMap[catKey].searchTerms);
                       }
                       return acc;
                   }, [])
                    thread.Colours["Colour Subsets"] =  [...new Set(allTerms)].join(', '); // Save searchable names

              } else {
                 thread.Colours.Colour = category;
               thread.Colours["Colour Subsets"] = searchTerms.join(', '); // Save searchable names
              }

            updatedCount++;
                console.log(`Updated Thread ID ${thread.id}: Colour = ${thread.Colours.Colour}`);
            } else {
            console.warn(`No category match found for hex ${hex} on thread: ${thread.id}`);
           }
        } else {
            console.warn(`No hex found for Thread ID ${thread.id}`);
        }
    });


    // Write the updated threadsData back to threads.json
    writeJSON(threadsPath, threadsData);

    // Summary of the update process
    console.log('\nUpdate Summary:');
    console.log(`Total Threads Processed: ${threadsData.length}`);
    console.log(`Threads Updated with Colour: ${updatedCount}`);
}

// Execute the update
updateThreadColours();