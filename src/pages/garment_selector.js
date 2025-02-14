// garment_selector.js

document.addEventListener('DOMContentLoaded', () => {
    const garmentCodeInput = document.getElementById('garment-code-lookup-input');
    const garmentColourOptionsDiv = document.getElementById('garment-colour-options');
    const garmentImageOptionsDiv = document.getElementById('garment-image-options'); // ADDED
    const garmentImagePreviewDiv = document.getElementById('garment-image-preview');
    const garmentLookupPanel = document.getElementById('garment-lookup-panel');

    garmentCodeInput.addEventListener('input', handleGarmentCodeInput);

    async function handleGarmentCodeInput() {
        const garmentCode = garmentCodeInput.value.trim().toUpperCase();
        if (garmentCode.length < 2) {
            garmentColourOptionsDiv.innerHTML = '';
            garmentImageOptionsDiv.innerHTML = ''; // Clear image options too
            garmentImagePreviewDiv.innerHTML = '';
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
        garmentImageOptionsDiv.innerHTML = ''; // Clear image options when colours change
        garmentImagePreviewDiv.innerHTML = '';

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
                button.addEventListener('click', (event) => handleColourSelection(event, garment)); // Pass garment object
            });
        } else {
            garmentColourOptionsDiv.innerHTML = `<p>No colour options available for ${garment.styleCode}.</p>`;
        }
    }

    function handleColourSelection(event, garment) { // RECEIVE GARMENT OBJECT
        const colourwayCode = event.target.dataset.colourwayCode;
        console.log(`Selected colourway code: ${colourwayCode}, Style Code: ${garment.styleCode}`);
        displayGarmentImageOptions(garment, colourwayCode); // Call new function to display image options
    }

    // --- NEW FUNCTION: Display Garment Image Options ---
    function displayGarmentImageOptions(garment, colourwayCode) {
        garmentImageOptionsDiv.innerHTML = ''; // Clear previous image options
        garmentImagePreviewDiv.innerHTML = ''; // Clear image preview

        const imageTypes = ['Front', 'Back', 'Side', 'Detail']; // Array of image types to check
        const imageOptionsHTML = imageTypes.map(imageType => {
            const imageUrl = constructImageUrl(garment.brand, garment.styleCode, colourwayCode, imageType);
            // For now, just create a button for each type - we'll check for image existence later if needed
            return `<button class="image-option-button" data-image-type="${imageType}" data-image-url="${imageUrl}">${imageType} View</button>`;
        }).join('');
        garmentImageOptionsDiv.innerHTML = imageOptionsHTML;

        // Add event listeners to image option buttons
        garmentImageOptionsDiv.querySelectorAll('.image-option-button').forEach(button => {
            button.addEventListener('click', (event) => handleImageSelection(event, garment, colourwayCode)); // Pass garment and colour code
        });
    }

    // --- NEW FUNCTION: Handle Image Selection ---
    function handleImageSelection(event, garment, colourwayCode) {
        const imageType = event.target.dataset.imageType;
        const imageUrl = event.target.dataset.imageUrl; // URL already constructed in displayGarmentImageOptions
        console.log(`Selected image type: ${imageType}, URL: ${imageUrl}`);
        displayGarmentPreviewImage(imageUrl); // Call function to display image in preview
    }


    // --- NEW FUNCTION: Display Garment Preview Image ---
    function displayGarmentPreviewImage(imageUrl) {
        garmentImagePreviewDiv.innerHTML = ''; // Clear previous preview

        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.onload = () => {
            garmentImagePreviewDiv.appendChild(imgElement);
        };
        imgElement.onerror = () => {
            garmentImagePreviewDiv.innerHTML = `<p>Image not available.</p>`; // Display message if image fails to load
        };
    }


    // --- Helper function to construct image URL ---
    function constructImageUrl(brand, styleCode, colourwayCode, view) {
        const baseUrl = 'https://www.fullcollection.com/storage/phoenix/2025/Phoenix%20All%20Images/';
        const brandPath = brand.replace(/\s+/g, '%20'); // URL-encode brand name (replace spaces with %20)
        const styleCodePath = styleCode.replace(/\s+/g, '%20'); // URL-encode style code
        const colourwayCodePath = colourwayCode.replace(/\s+/g, '%20'); // URL-encode colourway code

        const filename = `${styleCodePath}%20${colourwayCodePath}%20${view}.jpg`;
        return `${baseUrl}${brandPath}/Product%20Images/${styleCodePath}/ProductCarouselMain/${filename}`;
    }


    // --- Helper function to get colourway name from code ---
    let colourwayNamesMap = null;

    async function loadColourwayNamesMap() {
        if (!colourwayNamesMap) {
            const response = await fetch('/api/colourway-names');
            if (!response.ok) {
                console.error('Failed to load colourway names from /api/colourway-names');
                colourwayNamesMap = {};
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