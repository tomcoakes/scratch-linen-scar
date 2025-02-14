// garment_selector.js

document.addEventListener('DOMContentLoaded', () => {
    const garmentCodeInput = document.getElementById('garment-code-lookup-input');
    const garmentSuggestionsDropdown = document.getElementById('garment-code-suggestions'); // Autocomplete list
    const garmentColourDropdown = document.getElementById('garment-colour-dropdown'); // Colour dropdown <select>
    const garmentImageOptionsDiv = document.getElementById('garment-image-options');
    const garmentImagePreviewDiv = document.getElementById('garment-image-preview');
    const garmentLookupPanel = document.getElementById('garment-lookup-panel');

    let garmentDataCache = []; // Cache for all garment data (for autocomplete)
    let highlightedSuggestionIndex = -1; // Track highlighted suggestion

    garmentCodeInput.addEventListener('input', handleGarmentCodeInput);
    garmentSuggestionsDropdown.addEventListener('mousedown', (event) => {
        event.preventDefault();
    });

    // --- NEW: Keydown event listener for input ---
    garmentCodeInput.addEventListener('keydown', handleKeyboardNavigation);


    async function handleGarmentCodeInput(event) {
        const garmentCode = event.target.value.trim().toUpperCase();
        garmentImageOptionsDiv.innerHTML = '';
        garmentImagePreviewDiv.innerHTML = '';
        garmentColourDropdown.innerHTML = `<option value="">-- Select Colour --</option>`;
        highlightedSuggestionIndex = -1; // Reset highlight on new input

        if (garmentCode.length < 2) {
            garmentSuggestionsDropdown.style.display = 'none';
            garmentSuggestionsDropdown.innerHTML = '';
            garmentColourDropdown.innerHTML = `<option value="">-- Select Colour --</option>`;
            return;
        }

        const suggestions = await getGarmentCodeSuggestions(garmentCode);
        displayGarmentCodeSuggestions(suggestions);

        if (suggestions.length === 0) {
            try {
                const garments = await fetchGarmentData(garmentCode);
                displayGarmentColourOptions(garments[0]);
            } catch (error) {
                console.error("Error fetching garment data:", error);
                garmentColourDropdown.innerHTML = `<option value="">Error loading colours</option>`;
            }
        } else {
            garmentColourDropdown.innerHTML = `<option value="">-- Select Colour --</option>`;
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
            const allGarmentsResponse = await fetch('/api/garments');
            if (!allGarmentsResponse.ok) {
                throw new Error(`Failed to fetch all garment data for suggestions: ${allGarmentsResponse.status}`);
            }
            garmentDataCache = await allGarmentsResponse.json();
        }

        const searchTerm = partialCode.toUpperCase();
        return garmentDataCache.filter(garment =>
            garment.styleCode.toUpperCase().startsWith(searchTerm) //|| garment.title.toUpperCase().includes(searchTerm)
        ).slice(0, 10);
    }


    function displayGarmentCodeSuggestions(suggestions) {
        garmentSuggestionsDropdown.innerHTML = '';
        highlightedSuggestionIndex = -1; // Reset on new suggestions

        if (suggestions.length > 0) {
            suggestions.forEach((garment, index) => {
                const suggestionItem = document.createElement('li');
                suggestionItem.textContent = `${garment.styleCode} - ${garment.title}`;
                suggestionItem.addEventListener('mousedown', () => {
                    selectSuggestion(garment); // Use selectSuggestion function
                });
                garmentSuggestionsDropdown.appendChild(suggestionItem);
            });
            garmentSuggestionsDropdown.style.display = 'block';
            highlightSuggestion(0); // Highlight the first suggestion initially
        } else {
            garmentSuggestionsDropdown.style.display = 'none';
        }
    }

    function selectSuggestion(garment) {
        garmentCodeInput.value = garment.styleCode;
        garmentSuggestionsDropdown.style.display = 'none';
        displayGarmentColourOptions(garment);
        highlightedSuggestionIndex = -1; // Reset highlight after selection
    }


    function displayGarmentColourOptions(garment) {
        garmentColourDropdown.innerHTML = `<option value="">-- Select Colour --</option>`;
        garmentImageOptionsDiv.innerHTML = '';
        garmentImagePreviewDiv.innerHTML = '';

        if (!garment) {
            garmentColourDropdown.innerHTML = `<option value="">No garment found</option>`;
            return;
        }

        if (garment.colourwayCodes && garment.colourwayCodes.length > 0) {
            garment.colourwayCodes.forEach(colourCode => {
                const colourName = getColourwayName(colourCode) || colourCode;
                const option = document.createElement('option');
                option.value = colourCode;
                option.textContent = colourName;
                garmentColourDropdown.appendChild(option);
            });
            garmentColourDropdown.style.display = 'block';
        } else {
            garmentColourDropdown.innerHTML = `<option value="">No colours available</option>`;
        }
    }

    function handleColourSelection(event) {
        const colourwayCode = garmentColourDropdown.value;
        const selectedGarmentCode = garmentCodeInput.value.trim().toUpperCase();
        const selectedGarment = garmentDataCache.find(garment => garment.styleCode.toUpperCase() === selectedGarmentCode);

        if (selectedGarment) {
            displayGarmentImageOptions(selectedGarment, colourwayCode);
        } else {
            console.warn("Garment object not found for code:", selectedGarmentCode);
        }
    }

    garmentColourDropdown.addEventListener('change', handleColourSelection);


    function displayGarmentImageOptions(garment, colourwayCode) {
        garmentImageOptionsDiv.innerHTML = '';
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

    function handleImageSelection(event, garment, colourwayCode) {
        const imageType = event.target.dataset.imageType;
        const imageUrl = event.target.dataset.imageUrl;
        console.log(`Selected image type: ${imageType}, URL: ${imageUrl}`);
        displayGarmentPreviewImage(imageUrl);
    }

    function displayGarmentPreviewImage(imageUrl) {
        garmentImagePreviewDiv.innerHTML = '';

        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.style.cursor = 'pointer'; // Change cursor to pointer to indicate clickability

        imgElement.onload = () => {
            garmentImagePreviewDiv.appendChild(imgElement);
        };
        imgElement.onerror = () => {
            garmentImagePreviewDiv.innerHTML = `<p>Image not available.</p>`;
        };

        // --- NEW: Click event listener for the image ---
        garmentImagePreviewDiv.addEventListener('click', () => {
            const currentImageUrl = imgElement.src; // Get the image URL
            const currentGarmentCode = garmentCodeInput.value; // Get the garment code from input
            handleGarmentImageFromURL(currentImageUrl, currentGarmentCode); // Call the new function
        });
    }


function constructImageUrl(brand, styleCode, colourwayCode, view) {
    const baseUrl = 'https://www.fullcollection.com/storage/phoenix/2025/Phoenix%20All%20Images/';
    const brandPath = brand.replace(/\s+/g, '%20');
    const styleCodePath = styleCode.replace(/\s+/g, '%20');
    const colourwayCodePath = colourwayCode.replace(/\s+/g, '%20');

    const filename = `${styleCodePath}%20${colourwayCodePath}%20${view.toUpperCase()}.jpg`;
    const originalImageUrl = `${baseUrl}${brandPath}/Product%20Images/${styleCodePath}/ProductCarouselMain/${filename}`;

    // --- Use Glitch Proxy Route ---
    const glitchProxyUrl = '/garment-image-proxy?imageUrl='; // Path to your Glitch proxy route
    const proxiedImageUrl = glitchProxyUrl + encodeURIComponent(originalImageUrl); // Encode the original URL
    return proxiedImageUrl;
}


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


    // --- NEW: Keyboard Navigation Functions ---
    function handleKeyboardNavigation(event) {
        if (garmentSuggestionsDropdown.style.display !== 'block') return; // Only navigate if dropdown is visible

        const suggestions = garmentSuggestionsDropdown.querySelectorAll('li');
        if (!suggestions.length) return;

        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent form submission
            if (highlightedSuggestionIndex >= 0 && highlightedSuggestionIndex < suggestions.length) {
                const highlightedItem = suggestions[highlightedSuggestionIndex];
                const garmentCode = highlightedItem.textContent.split(' - ')[0]; // Extract code from text
                const selectedGarment = garmentDataCache.find(g => g.styleCode === garmentCode);
                if (selectedGarment) {
                    selectSuggestion(selectedGarment);
                }
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            highlightNextSuggestion(suggestions);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            highlightPreviousSuggestion(suggestions);
        }
    }

    function highlightSuggestion(index) {
        const suggestions = garmentSuggestionsDropdown.querySelectorAll('li');
        if (!suggestions.length) return;

        // Remove previous highlight
        const highlighted = garmentSuggestionsDropdown.querySelector('.highlighted');
        if (highlighted) {
            highlighted.classList.remove('highlighted');
        }

        if (index >= 0 && index < suggestions.length) {
            suggestions[index].classList.add('highlighted');
            highlightedSuggestionIndex = index;
        } else {
            highlightedSuggestionIndex = -1;
        }
    }

    function highlightNextSuggestion(suggestions) {
        let nextIndex = highlightedSuggestionIndex + 1;
        if (nextIndex >= suggestions.length) {
            nextIndex = 0; // Wrap around to the first item
        }
        highlightSuggestion(nextIndex);
    }

    function highlightPreviousSuggestion(suggestions) {
        let prevIndex = highlightedSuggestionIndex - 1;
        if (prevIndex < 0) {
            prevIndex = suggestions.length - 1; // Wrap around to the last item
        }
        highlightSuggestion(prevIndex);
    }


    // Ensure panel is visible by default (optional, can also do in CSS)
    garmentLookupPanel.style.display = 'block';
});