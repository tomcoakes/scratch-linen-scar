// ingest_garment_data.js

require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // For making HTTP requests
const AdmZip = require('adm-zip');   // For unzipping files

async function ingestGarmentData() {
    console.log("Starting garment data ingestion...");

    const zipFilePath = path.join(__dirname, 'supplier_data', 'products.zip'); // Where to save the downloaded zip
    const extractPath = path.join(__dirname, 'supplier_data', 'extracted_products'); // Folder to extract contents into

    const apiEndpoint = 'https://www.pencarrie.com/api/public/v1/export/products.zip';
    const apiToken = process.env.PENCARRIE_API_TOKEN; // Access your token from .env

    if (!apiToken) {
        console.error("Error: PENCARRIE_API_TOKEN environment variable is not set in .env file.");
        return; // Stop execution if token is missing
    }

    try {
        console.log("Downloading products.zip...");
        const response = await fetch(apiEndpoint, {
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            throw new Error(`Download failed: ${response.statusText}`);
        }

        const buffer = await response.buffer();
        fs.writeFileSync(zipFilePath, buffer);
        console.log(`products.zip downloaded successfully to: ${zipFilePath}`);

        // --- Unzipping ---
        console.log("Unzipping products.zip...");
        const zip = new AdmZip(zipFilePath);

        // Ensure the extraction directory exists
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }

        zip.extractAllTo(extractPath, true); // true for overwrite
        console.log(`products.zip extracted to: ${extractPath}`);

        console.log("Garment data ingestion - Download and Unzip COMPLETED!");

    } catch (error) {
        console.error("Error during garment data ingestion:", error);
        console.error("Make sure your .env file is set up correctly and your API token is valid.");
    }
}

ingestGarmentData();