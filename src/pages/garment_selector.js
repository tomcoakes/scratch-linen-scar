// garment_selector.js

document.addEventListener('DOMContentLoaded', () => {
    const garmentCodeInput = document.getElementById('garment-code-lookup-input'); // CORRECT INPUT ID
    const garmentColourOptionsDiv = document.getElementById('garment-colour-options');
    const garmentImagesPreviewDiv = document.getElementById('garment-image-preview'); // ADDED

    garmentCodeInput.addEventListener('input', handleGarmentCodeInput);

    async function handleGarmentCodeInput() {
        const garmentCode = garmentCodeInput.value.trim().toUpperCase(); // Get garment code, convert to uppercase for consistency
        if (garmentCode.length < 2) { 
            garmentColourOptionsDiv.innerHTML = '';
            garmentImagesPreviewDiv.innerHTML = '';const response = await fetch('/colourway
            return;
        }

        try {
            const garments = await fetchGarmentData(garmentCode);
            displayGarmentColourOptions(garments[0]); // Pass only the first garment (as we're grouping by styleCode now)
        } catch (error) {
            console.error("Error fetching garment data:", error);
            garmentColourOptionsDiv.innerHTML = `<p>Error loading garment data.</p>`;
        }
    }

    async function fetchGarmentData(code) {
        const response = await fetch(`/api/garments?code=${code}`); // Correct API endpoint
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
         return data.filter(garment => garment.styleCode.toUpperCase() === code.toUpperCase()); // Filter on frontend to match case-insensitive
    }


    function displayGarmentColourOptions(garment) {
        garmentColourOptionsDiv.innerHTML = ''; // Clear previous options
        garmentImagesPreviewDiv.innerHTML = ''; // Clear image preview

        if (!garment) {
            garmentColourOptionsDiv.innerHTML = `<p>No garment found for this code.</p>`;
            return;
        }

        if (garment.colourwayCodes && garment.colourwayCodes.length > 0) {
            const colourOptionsHTML = garment.colourwayCodes.map(colourCode => {
                const colourName = getColourwayName(colourCode) || colourCode; // Get user-friendly name or use code if name not found
                return `<button class="colour-option-button" data-colourway-code="${colourCode}">${colourName}</button>`;
            }).join('');
            garmentColourOptionsDiv.innerHTML = colourOptionsHTML;

            // Add event listeners to colour option buttons
            garmentColourOptionsDiv.querySelectorAll('.colour-option-button').forEach(button => {
                button.addEventListener('click', handleColourSelection);
            });
        } else {
            garmentColourOptionsDiv.innerHTML = `<p>No colour options available for ${garment.styleCode}.</p>`;
        }
    }

    function handleColourSelection(event) {
        const colourwayCode = event.target.dataset.colourwayCode;
        // ... (Next step: Display garment images for selected colour) ...
        console.log(`Selected colourway code: ${colourwayCode}`);
    }

    // --- Helper function to get colourway name from code (using colourway_names.json) ---
    let colourwayNamesMap = null; // Store the colourway names map in a variable

    async function loadColourwayNamesMap() {
        if (!colourwayNamesMap) { // Load only once
            const response = await fetch('/colourway_names.json'); // Fetch your mapping JSON
            if (!response.ok) {
                console.error('Failed to load colourway_names.json');
                colourwayNamesMap = {}; // Default to empty map
            } else {
                const namesArray = await response.json();
                colourwayNamesMap = namesArray.reduce((map, obj) => {
                    map[obj.code] = obj.name; // Create code-to-name map
                    return map;
                }, {});
                console.log('Loaded colourway_names.json map:', colourwayNamesMap);
            }
        }
    }

    function getColourwayName(code) {
        return colourwayNamesMap[code] || null; // Return name or null if not found
    }

    // Load colourway names map on script load
    loadColourwayNamesMap();
});