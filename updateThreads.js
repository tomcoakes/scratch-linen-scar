// updateThreads.js

const fs = require('fs');
const path = require('path');

// Paths to JSON files
const threadsPath = path.join(__dirname, 'threads.json');
const madeiraThreadsPath = path.join(__dirname, 'madeiraThreads.json');

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

// Main update function
function updateThreads() {
    console.log('Starting update process...');

    // Read and parse JSON files
    const threadsData = readJSON(threadsPath);
    const madeiraThreadsData = readJSON(madeiraThreadsPath);

    // Create a lookup map for madeiraThreads based on ThreadNumber
    const madeiraLookup = {};

    madeiraThreadsData.forEach(entry => {
        const threadNumber = entry.ThreadNumber;
        const hexCode = entry.HexCode;

        // If ThreadNumber is not already in the lookup, add it
        if (!madeiraLookup[threadNumber]) {
            madeiraLookup[threadNumber] = hexCode;
        } else {
            // If ThreadNumber already exists, ensure HexCode consistency
            if (madeiraLookup[threadNumber] !== hexCode) {
                console.warn(`Warning: Multiple HexCodes found for ThreadNumber ${threadNumber}. Using the first encountered HexCode (${madeiraLookup[threadNumber]}).`);
            }
            // If HexCode is the same, no action needed
        }
    });

    let updatedCount = 0;
    let skippedCount = 0;
    let alreadyHasHexCount = 0;

    threadsData.forEach(thread => {
        const threadNumber = Number(thread["Thread Number"]); // Convert to number for matching

        // Check if thread already has Hex
        if (thread.Hex) {
            alreadyHasHexCount++;
            return; // Skip updating this thread
        }

        // Lookup HexCode based on ThreadNumber
        if (madeiraLookup.hasOwnProperty(threadNumber)) {
            thread.Hex = madeiraLookup[threadNumber];
            updatedCount++;
            console.log(`Updated Thread ID ${thread.id}: Hex = ${thread.Hex}`);
        } else {
            skippedCount++;
            console.warn(`No HexCode found for Thread ID ${thread.id} with Thread Number ${threadNumber}.`);
        }
    });

    // Write the updated threadsData back to threads.json
    writeJSON(threadsPath, threadsData);

    // Summary of the update process
    console.log('\nUpdate Summary:');
    console.log(`Total Threads Processed: ${threadsData.length}`);
    console.log(`Threads Updated with Hex: ${updatedCount}`);
    console.log(`Threads Skipped (No HexCode Found): ${skippedCount}`);
    console.log(`Threads Already Had Hex: ${alreadyHasHexCount}`);
}

// Execute the update
updateThreads();
