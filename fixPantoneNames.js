// fixPantoneNames.js - DEBUGGING VERSION

const fs = require('fs');
const path = require('path');

// Corrected path to pantone.json - assuming script is in the project root
const pantoneFilePath = path.join(__dirname, 'src', 'pages', 'pantone.json');

console.log("__dirname is:", __dirname); // DEBUG: Check __dirname at the START

fs.readFile(pantoneFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading pantone.json:", err);
    return;
  }

  console.log("Successfully read pantone.json file."); // DEBUG: File read success

  let pantoneData;
  try {
    pantoneData = JSON.parse(data);
    console.log("Successfully parsed pantone.json data."); // DEBUG: JSON parse success
  } catch (parseError) {
    console.error("Error parsing pantone.json:", parseError);
    return;
  }

  let changesMade = false;
  let changesCounter = 0; // Counter for changes

  const updatedPantoneData = pantoneData.map(entry => {
    const infoArray = entry[1];
    let pantoneName = infoArray[0];

    if (pantoneName && pantoneName.includes('-')) {
      const originalName = pantoneName;
      pantoneName = pantoneName.replace(/-/g, ' '); // Replace all hyphens with spaces
      infoArray[0] = pantoneName;
      changesMade = true;
      changesCounter++; // Increment counter
      console.log(`[CHANGE ${changesCounter}] Replaced hyphens in Pantone name: "${originalName}" -> "${pantoneName}"`); // DEBUG: Log each change
    } else {
      //console.log(`No change for Pantone name: "${pantoneName}"`); // Optional: Log names with no changes
    }
    return entry;
  });

  console.log("Changes detected:", changesMade); // DEBUG: changesMade flag value
  console.log("Number of changes made:", changesCounter); // DEBUG: changes counter value

  if (changesMade) {
    const jsonString = JSON.stringify(updatedPantoneData, null, 2);
    //console.log("JSON string to write:\n", jsonString); // Optional: Log the JSON string before writing - BE CAREFUL, COULD BE VERY LONG

    fs.writeFile(pantoneFilePath, jsonString, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error("Error writing to pantone.json:", writeErr);
        return;
      }
      console.log("Successfully wrote updated pantone.json to disk."); // DEBUG: Write file success
      console.log("Successfully updated pantone.json to replace hyphens with spaces in Pantone names.");
    });
  } else {
    console.log("No Pantone names with hyphens found to replace. No file write needed.");
  }
});