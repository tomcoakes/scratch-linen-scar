// garment_selector.js

document.addEventListener('DOMContentLoaded', () => {
    const garmentCodeInput = document.getElementById('garment-code-lookup-input');
    const garmentSuggestionsDropdown = document.getElementById('garment-code-suggestions'); // Autocomplete list
    const garmentColourDropdown = document.getElementById('garment-colour-dropdown'); // Colour dropdown <select>
    const garmentImageOptionsDiv = document.getElementById('garment-image-options');
    const garmentImagePreviewDiv = document.getElementById('garment-image-preview');
    const garmentLookupPanel = document.getElementById('garment-lookup-panel');


    let garmentDataCache = []; // Cache for all garment data (for autocomplete)

    garmentCodeInput.addEventListener('input', handleGarmentCodeInput);
    // REMOVE focus event listener that shows the panel on focus
    // garmentCodeInput.addEventListener('focus', () => garmentLookupPanel.style.display = 'block');
    // REMOVE blur event listener that hides the panel on blur
    // garmentCodeInput.addEventListener('blur', () => setTimeout(() => {
    //     if (!garmentLookupPanel.matches(':hover')) {
    //         garmentLookupPanel.style.display = 'none';
    //         garmentSuggestionsDropdown.style.display = 'none'; // Hide suggestions too on blur
    //     }
    // }, 200));
    // REMOVE mouseleave event listener that hides the panel on mouseleave
    // garmentLookupPanel.addEventListener('mouseleave', () => garmentLookupPanel.style.display = 'none');
    garmentSuggestionsDropdown.addEventListener('mousedown', (event) => { // Mousedown instead of click
        event.preventDefault(); // Prevent blur event when clicking on suggestion
    });


    async function handleGarmentCodeInput(event) {
        const garmentCode = event.target.value.trim().toUpperCase();
        garmentImageOptionsDiv.innerHTML = ''; // Clear image options
        garmentImagePreviewDiv.innerHTML = ''; // Clear image preview
        garmentColourDropdown.innerHTML = `<option value="">-- Select Colour --</option>`; // Reset colour dropdown

        if (garmentCode.length < 2) {
            garmentSuggestionsDropdown.style.display = 'none'; // Hide dropdown if input too short
            garmentSuggestionsDropdown.innerHTML = '';
            garmentColourDropdown.innerHTML = `<option value="">-- Select Colour --</option>`; // Clear colour options just in case (and reset to default)
            return;
        }

        const suggestions = await getGarmentCodeSuggestions(garmentCode); // Get suggestions
        displayGarmentCodeSuggestions(suggestions); // Display suggestions

        if (suggestions.length === 0) {
            // If no suggestions (and input is long enough), try to fetch garment directly
            try {
                const garments = await fetchGarmentData(garmentCode);
                displayGarmentColourOptions(garments[0]); // Display colours, even if no suggestions
            } catch (error) {
                console.error("Error fetching garment data:", error);
                garmentColourDropdown.innerHTML = `<option value="">Error loading colours</option>`;
            }
        } else {
            garmentColourDropdown.innerHTML = `<option value="">-- Select Colour --</option>`; // Clear colour options if showing suggestions (and reset to default)
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

    async function getGarmentCodeSuggestions(partialCode) {
        if (garmentDataCache.length === 0) {
            const allGarmentsResponse = await fetch('/api/garments'); // Fetch ALL garments for cache
            if (!allGarmentsResponse.ok) {
                throw new Error(`Failed to fetch all garment data for suggestions: ${allGarmentsResponse.status}`);
            }
            garmentDataCache = await allGarmentsResponse.json(); // Cache all garment data
        }

        const searchTerm = partialCode.toUpperCase();
        return garmentDataCache.filter(garment =>
            garment.styleCode.toUpperCase().startsWith(searchTerm) || garment.title.toUpperCase().includes(searchTerm)
        ).slice(0, 10); // Limit suggestions to top 10
    }


    function displayGarmentCodeSuggestions(suggestions) {
        garmentSuggestionsDropdown.innerHTML = ''; // Clear existing suggestions

        if (suggestions.length > 0) {
            suggestions.forEach(garment => {
                const suggestionItem = document.createElement('li');
                suggestionItem.textContent = `${garment.styleCode} - ${garment.title}`;
                suggestionItem.addEventListener('mousedown', () => { // Mousedown to prevent blur issue
                    garmentCodeInput.value = garment.styleCode;
                    garmentSuggestionsDropdown.style.display = 'none'; // Hide suggestions
                    displayGarmentColourOptions(garment); // Directly load colours for selected garment
                });
                garmentSuggestionsDropdown.appendChild(suggestionItem);
            });
            garmentSuggestionsDropdown.style.display = 'block'; // Show dropdown
        } else {
            garmentSuggestionsDropdown.style.display = 'none'; // Hide if no suggestions
        }
    }


    function displayGarmentColourOptions(garment) {
        garmentColourDropdown.innerHTML = `<option value="">-- Select Colour --</option>`; // Clear and reset dropdown
        garmentImageOptionsDiv.innerHTML = ''; // Clear image options
        garmentImagePreviewDiv.innerHTML = '';

        if (!garment) {
            garmentColourDropdown.innerHTML = `<option value="">No garment found</option>`;
            return;
        }

        if (garment.colourwayCodes && garment.colourwayCodes.length > 0) {
            garment.colourwayCodes.forEach(colourCode => {
                const colourName = getColourwayName(colourCode) || colourCode;
                const option = document.createElement('option');
                option.value = colourCode; // Store code as value (Corrected: using colourCode)
                option.textContent = colourName; // Display user-friendly name
                garmentColourDropdown.appendChild(option);
            });
             garmentColourDropdown.style.display = 'block'; // Make dropdown visible
        } else {
            garmentColourDropdown.innerHTML = `<option value="">No colours available</option>`;
        }
    }

    function handleColourSelection(event) {
        const colourwayCode = garmentColourDropdown.value; // Get selected colourway code from dropdown
         const selectedGarmentCode = garmentCodeInput.value.trim().toUpperCase();
        const selectedGarment = garmentDataCache.find(garment => garment.styleCode.toUpperCase() === selectedGarmentCode);


        if (selectedGarment) {
           displayGarmentImageOptions(selectedGarment, colourwayCode);
        } else {
            console.warn("Garment object not found for code:", selectedGarmentCode);
        }

    }

    garmentColourDropdown.addEventListener('change', handleColourSelection); // ADD CHANGE EVENT LISTENER TO DROPDOWN


    // --- Display Garment Image Options (unchanged) ---
    function displayGarmentImageOptions(garment, colourwayCode) {
        garmentImageOptionsDiv.innerHTML = ''; // Clear previous image options
        garmentImagePreviewDiv.innerHTML = '';

        const imageTypes = ['Front', 'Back', 'Side', 'Detail'];
        const imageOptionsHTML = imageTypes.map(imageType => {
            const imageUrl = constructImageUrl(garment.brand, garment.styleCode, colourwayCode, imageType);
            return `<button class="image-option-button" data-image-type="${imageType}" data-image-url="${imageUrl}">${imageType} View</button>`;
        }).join('');
        garmentImageOptionsDiv.innerHTML = imageOptionsHTML;

        garmentImageOptionsDiv.querySelectorAll('.image-option-button').forEach(button => {
            button.addEventListener('click', (event) => handleImageSelection(event, garment, colourwayCode));
        });
    }

    // --- Handle Image Selection (unchanged) ---
    function handleImageSelection(event, garment, colourwayCode) {
        const imageType = event.target.dataset.imageType;
        const imageUrl = event.target.dataset.imageUrl;
        console.log(`Selected image type: ${imageType}, URL: ${imageUrl}`);
        displayGarmentPreviewImage(imageUrl);
    }

    // --- Display Garment Preview Image (unchanged) ---
    function displayGarmentPreviewImage(imageUrl) {
        garmentImagePreviewDiv.innerHTML = '';

        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.onload = () => {
            garmentImagePreviewDiv.appendChild(imgElement);
        };
        imgElement.onerror = () => {
            garmentImagePreviewDiv.innerHTML = `<p>Image not available.</p>`;
        };
    }


    // --- Helper function to construct image URL (unchanged) ---
    function constructImageUrl(brand, styleCode, colourwayCode, view) {
        const baseUrl = 'https://www.fullcollection.com/storage/phoenix/2025/Phoenix%20All%20Images/';
        const brandPath = brand.replace(/\s+/g, '%20');
        const styleCodePath = styleCode.replace(/\s+/g, '%20');
        const colourwayCodePath = colourwayCode.replace(/\s+/g, '%20');

        const filename = `${styleCodePath}%20${colourwayCodePath}%20${view.toUpperCase}.jpg`;
        return `${baseUrl}${brandPath}/Product%20Images/${styleCodePath}/ProductCarouselMain/${filename}`;
    }


    // --- Helper function to get colourway name from code (unchanged) ---
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
                console.log('Loaded colourway_names.json map:', colourwayNamesMap);
            }
        }
    }

    function getColourwayName(code) {
        return colourwayNamesMap[code] || null;
    }

    loadColourwayNamesMap();

    // --- Show/Hide Garment Lookup Panel (REMOVED HIDING LOGIC) ---
    // garmentCodeInput.addEventListener('focus', () => {
    //     garmentLookupPanel.style.display = 'block';
    //     garmentSuggestionsDropdown.style.display = 'block'; // Show suggestions dropdown on focus
    // });

    // garmentCodeInput.addEventListener('blur', () => {
    //     setTimeout(() => {
    //         if (!garmentLookupPanel.matches(':hover')) {
    //             garmentLookupPanel.style.display = 'none';
    //              garmentSuggestionsDropdown.style.display = 'none'; // Hide suggestions on blur too
    //         }
    //     }, 200);
    // });

    // garmentLookupPanel.addEventListener('mouseleave', () => {
    //     garmentLookupPanel.style.display = 'none';
    //      garmentSuggestionsDropdown.style.display = 'none'; // Hide suggestions on mouseleave too
    // });

    // Ensure panel is visible by default in JavaScript (optional, can also do in CSS)
    garmentLookupPanel.style.display = 'block';
});