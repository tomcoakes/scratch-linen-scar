// ingest_garment_data.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const AdmZip = require('adm-zip');
const csvParser = require('csv-parser');

const DELAY = 3000;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function ingestGarmentData() {
    console.log("Starting garment data ingestion (parsing only selected headers)...");

    const zipFilePath = path.join(__dirname, 'supplier_data', 'products.zip');
    const extractPath = path.join(__dirname, 'supplier_data', 'extracted_products');
    const garmentCataloguePath = path.join(__dirname, 'garment_catalogue.json');
    const csvFilePath = path.join(extractPath, 'products.csv'); 

    const apiEndpoint = 'https://www.pencarrie.com/api/public/v1/export/products.zip';
    const apiToken = process.env.PENCARRIE_API_TOKEN;

    if (!apiToken) {
        console.error("Error: PENCARRIE_API_TOKEN environment variable is not set in .env file.");
        return;
    }

    try {
        console.log("Downloading products.zip...");
        await delay(DELAY);
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
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true });
        }
        zip.extractAllTo(extractPath, true);
        console.log(`products.zip extracted to: ${extractPath}`);

        // --- CSV Parsing and JSON Conversion (Selecting only needed headers) ---
        console.log("Parsing CSV (selected headers) and converting to JSON...");
        const garments = [];

        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                try {
                    // --- Transform and structure data - SELECTING ONLY NEEDED FIELDS ---
                    const garment = {
                        sku: row['SKU'],
                        styleCode: row['Style Code'],
                        title: row['Title'],
                        brand: row['Brand'],
                        type: row['Type'],
                        colourwayName: row['Colourway Name'],
                        frontImage: row['Front Image'],
                        backImage: row['Back Image'],
                        sideImage: row['Side Image'],
                        detailImage: row['Detail Image']
                    };
                    garments.push(garment);
                     console.log("Parsed garment (SKU):", garment.sku, garment.title); // Log successful parse
                } catch (error) {
                    console.error("Error parsing CSV row:", error);
                }
            })
            .on('error', (error) => {
                console.error("CSV parsing error:", error);
            })
            .on('end', () => {
                fs.writeFile(garmentCataloguePath, JSON.stringify(garments, null, 2), (err) => {
                    if (err) {
                        console.error("Error writing garment_catalogue.json:", err);
                    } else {
                        console.log(`Successfully converted ${garments.length} garments and saved to garment_catalogue.json`);
                    }

                    // --- Delete CSV file ---
                    fs.unlink(csvFilePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error("Error deleting CSV file:", unlinkErr);
                        } else {
                            console.log(`CSV file deleted: ${csvFilePath}`);
                        }
                    });
                });
            });

        console.log("Garment data ingestion and JSON conversion COMPLETED (selected headers)!");

    } catch (error) {
        console.error("Error during garment data ingestion:", error);
        console.error("Make sure your .env file is set up correctly and your API token is valid.");
    }
}

ingestGarmentData();