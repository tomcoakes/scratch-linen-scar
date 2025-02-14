// garment_selector.js

document.addEventListener('DOMContentLoaded', () => {
    const garmentCodeInput = document.getElementById('garment-code-lookup-input');
    const garmentColourOptionsDiv = document.getElementById('garment-colour-options');
    const garmentImagesPreviewDiv = document.getElementById('garment-image-preview');
    const garmentLookupPanel = document.getElementById('garment-lookup-panel');

    garmentCodeInput.addEventListener('input', handleGarmentCodeInput);

    async function handleGarmentCodeInput() {
        const garmentCode = garmentCodeInput.value.trim().toUpperCase();
        if (garmentCode.length < 2) {
            garmentColourOptionsDiv.innerHTML = '';
            garmentImagesPreviewDiv.innerHTML = '';
            return;
        }

        try {
            const garments = await fetchGarmentData(garmentCode);
            displayGarmentColourOptions(garments[0]);
        } catch (error) {
            console.error("Error fetching garment data:", error);
            garmentColourOptionsDiv.innerHTML = `<p>Error loading garment data.</p>`;
        }
    }

    async function fetchGarmentData(code) {
        const response = await fetch(`/api/garments?code=${code}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.filter(garment => garment.styleCode.toUpperCase() === code.toUpperCase());
    }


    function displayGarmentColourOptions(garment) {
        garmentColourOptionsDiv.innerHTML = '';
        garmentImagesPreviewDiv.innerHTML = '';

        if (!garment) {
            garmentColourOptionsDiv.innerHTML = `<p>No garment found for this code.</p>`;
            return;
        }

        if (garment.colourwayCodes && garment.colourwayCodes.length > 0) {
            const colourOptionsHTML = garment.colourwayCodes.map(colourCode => {
                const colourName = getColourwayName(colourCode) || colourCode;
                return `<button class="colour-option-button" data-colourway-code="${colourCode}">${colourName}</button>`;
            }).join('');
            garmentColourOptionsDiv.innerHTML = colourOptionsHTML;

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

    // --- Helper function to get colourway name from code ---
    let colourwayNamesMap = null;

    async function loadColourwayNamesMap() {
        if (!colourwayNamesMap) { // Load only once
            const response = await fetch('/api/colourway-names'); // CORRECTED fetch path - API endpoint!
            if (!response.ok) {
                console.error('Failed to load colourway names from /api/colourway-names');
                colourwayNamesMap = {}; // Default to empty map
            } else {
                const namesArray = await response.json();
                colourwayNamesMap = namesArray.reduce((map, obj) => {
                    map[obj.code] = obj.name;
                    return map;
                }, {});
                console.log('Loaded colourway names map from /api/colourway-names:', colourwayNamesMap);
            }
        }
    }

    function getColourwayName(code) {
        return colourwayNamesMap[code] || null;
    }

    loadColourwayNamesMap();

    // --- Show/Hide Garment Lookup Panel ---
    garmentCodeInput.addEventListener('focus', () => {
        garmentLookupPanel.style.display = 'block';
    });

    garmentCodeInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (!garmentLookupPanel.matches(':hover')) {
                garmentLookupPanel.style.display = 'none';
            }
        }, 200);
    });

    garmentLookupPanel.addEventListener('mouseleave', () => {
        garmentLookupPanel.style.display = 'none';
    });
});