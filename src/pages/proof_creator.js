// proof_creator.js

var fabric; // Declare fabric as a global variable
let proofCreatorCanvas;
let selectedCustomer = null;
let selectedLogos = [];
let zoomLevel = 1;
const ZOOM_INCREMENT = 0.2;
let panning = false;
let lastPosX = 0;
let lastPosY = 0;
let views = []; // Array to store canvas states (each view is a canvas state as JSON)
let currentViewIndex = 0;

// --- Canvas dimensions ---
const CANVAS_WIDTH = 1800;  // High-resolution width
const CANVAS_HEIGHT = 1800; // High-resolution height
const DISPLAY_WIDTH = 600;   // Visual width on screen
const DISPLAY_HEIGHT = 600;  // Visual height on screen
const SCALE_FACTOR = CANVAS_WIDTH / DISPLAY_WIDTH; // Calculate scale factor

document.addEventListener('DOMContentLoaded', () => {
    proofCreatorCanvas = new fabric.Canvas('proof-canvas', {
        backgroundColor: '#ffffff',
        selection: true,
        //  Set initial dimensions (high resolution)
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
    });
    views.push({}); // Initialize views array with one empty view

      // --- Override Fabric.js's canvas sizing AFTER initialization ---
    proofCreatorCanvas.setWidth(CANVAS_WIDTH);
    proofCreatorCanvas.setHeight(CANVAS_HEIGHT);
    proofCreatorCanvas.wrapperEl.style.width = `${DISPLAY_WIDTH}px`; // Set wrapper size (visual)
    proofCreatorCanvas.wrapperEl.style.height = `${DISPLAY_HEIGHT}px`;
    proofCreatorCanvas.lowerCanvasEl.style.width = `${DISPLAY_WIDTH}px`;  // Override inline styles!
    proofCreatorCanvas.lowerCanvasEl.style.height = `${DISPLAY_HEIGHT}px`;
    proofCreatorCanvas.upperCanvasEl.style.width = `${DISPLAY_WIDTH}px`;
    proofCreatorCanvas.upperCanvasEl.style.height = `${DISPLAY_HEIGHT}px`;

    // Set default control appearance for all objects on the canvas
    fabric.Object.prototype.set({
        cornerSize: 12,
        cornerColor: '#1abc9c',
        cornerStyle: 'circle',
        transparentCorners: false,
        borderColor: '#3498db',
        borderScaleFactor: 2.5,
        padding: 10, // Add some padding around the object for better handle visibility
    });

    // --- Rotation Snapping ---
    proofCreatorCanvas.on('object:rotating', function(e) {
        const obj = e.target;
        const snapAngle = 5; // Degrees within which to snap
        const targetAngles = [0, 90, 180, 270];
        let currentAngle = obj.angle % 360; // Normalize angle to 0-360
        if (currentAngle < 0) {
            currentAngle += 360; // Ensure positive angle
        }

        let closestAngle = currentAngle;
        let minDiff = snapAngle; // Initialize with snapAngle to check if any snap is needed

        targetAngles.forEach(target => {
            let diff = Math.abs(currentAngle - target);
            diff = Math.min(diff, 360 - diff); // Handle wrapping around 360 degrees
            if (diff < minDiff) {
                minDiff = diff;
                closestAngle = target;
            }
        });

        if (minDiff <= snapAngle) {
            obj.angle = closestAngle;
            obj.setCoords(); // Update object controls position
            proofCreatorCanvas.renderAll(); // Re-render canvas immediately to show snap
        }
    });


    // Get references to the zoom buttons:
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const resetZoomButton = document.getElementById('reset-zoom');
    const addViewButton = document.getElementById('add-view-button');
      const prevViewButton = document.getElementById('prev-view-button');
    const nextViewButton = document.getElementById('next-view-button');

    // Event listeners for zoom buttons:
    zoomInButton.addEventListener('click', zoomIn);
    zoomOutButton.addEventListener('click', zoomOut);
    resetZoomButton.addEventListener('click', resetZoom);
    addViewButton.addEventListener('click', addView); // Add View button listener
      prevViewButton.addEventListener('click', previousView);
    nextViewButton.addEventListener('click', nextView);




    // --- Mouse wheel zoom ---
   proofCreatorCanvas.on('mouse:wheel', function(opt) {
    var delta = opt.e.deltaY;
    var zoom = proofCreatorCanvas.getZoom();
    zoom *= 0.999 ** delta;

    // Limit zoom levels
    if (zoom > 5) zoom = 5;  // Max zoom level (adjust as needed)
    if (zoom < 0.2) zoom = 0.2; // Min zoom level (adjust as needed)

    // Get the mouse pointer position relative to the canvas
    var pointer = proofCreatorCanvas.getPointer(opt.e);

    // Zoom to the pointer position
    proofCreatorCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);

    // Prevent default scrolling behavior
    opt.e.preventDefault();
    opt.e.stopPropagation();
});

    // --- Panning ---
    proofCreatorCanvas.on('mouse:down', function (opt) {
        var evt = opt.e;
        if (!opt.target) { // Check if click is on canvas background
            this.isDragging = true;
            this.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
        } else {
            this.isDragging = false;
            this.selection = true;
        }
    });

    proofCreatorCanvas.on('mouse:move', function (opt) {
        if (this.isDragging) {
            var e = opt.e;
            var vpt = this.viewportTransform;
            vpt[4] += e.clientX - lastPosX;
            vpt[5] += e.clientY - lastPosY;
            this.requestRenderAll();
            lastPosX = e.clientX;
            lastPosY = e.clientY;
        }
    });

    proofCreatorCanvas.on('mouse:up', function (opt) {
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        this.selection = true;
    });

    // --- Keyboard Delete ---
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteActiveObject();
        }
    });


    setupCustomerSearch();
    setupGarmentImageUpload();
    populateCustomerList();

    const submitProofButton = document.getElementById('submit-proof-button');
    submitProofButton.addEventListener('click', submitProof);


    updateCarousel(); // Initialize carousel indicators
    loadCurrentView(); // Load the initial view (first in the array)
});

// --- Canvas View Management ---

function addView() {
    saveCurrentView();
    views.push({}); // Add a new blank view
    currentViewIndex = views.length - 1;
    updateCarousel();
    loadCurrentView();
    proofCreatorCanvas.renderAll();
    console.log(`addView: Added new blank view. Total views: ${views.length}, Current index: ${currentViewIndex}`); // ADDED LOG
     console.log("addView: views array after addView:", views); // ADDED LOG - Inspect views array
}

function updateCarousel() {
    const indicatorsContainer = document.getElementById('canvas-view-indicators');
    indicatorsContainer.innerHTML = ''; // Clear existing indicators

    views.forEach((view, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'view-indicator';
        indicator.dataset.viewIndex = index;

        if (index === currentViewIndex) {
            indicator.classList.add('active');
        }

        indicator.addEventListener('click', () => {
            switchToView(index);
        });

        indicatorsContainer.appendChild(indicator);
    });

    console.log(`updateCarousel: Current view index: ${currentViewIndex}, Total views: ${views.length}`); // ADDED LOG
}

function switchToView(index) {
    if (index >= 0 && index < views.length) {
        saveCurrentView();
        currentViewIndex = index;
        updateCarousel(); // Update indicators
        loadCurrentView(); // Load the selected view
        console.log(`switchToView: Switched to view index: ${index}`); // ADDED LOG
         console.log("switchToView: views array after switchToView:", views); // ADDED LOG - Inspect views array
    } else {
        console.warn('Invalid view index:', index);
    }
}

function previousView() {
    switchToView(currentViewIndex - 1); // Switch to the previous view
}

function nextView() {
    switchToView(currentViewIndex + 1); // Switch to the next view
}

function loadCurrentView() {
    const viewState = views[currentViewIndex];
    proofCreatorCanvas.clear();
    if (viewState) {
        proofCreatorCanvas.loadFromJSON(viewState, () => {
              proofCreatorCanvas.viewportTransform = [1, 0, 0, 1, 0, 0]; //reset the view port
              proofCreatorCanvas.setZoom(1); //reset the zoom level
            proofCreatorCanvas.renderAll();
            console.log(`LOAD VIEW: Loaded view at index: ${currentViewIndex}`);
            console.log(`LOAD VIEW: Number of objects on canvas after load: ${proofCreatorCanvas.getObjects().length}`); // Log object count after load
             console.log(`LOAD VIEW: Loaded canvas state (first 50 chars): ${JSON.stringify(viewState).substring(0, 50)}...`); // Log start of JSON
        });
    } else {
        proofCreatorCanvas.setBackgroundImage(null, proofCreatorCanvas.renderAll.bind(proofCreatorCanvas));
        console.log(`LOAD VIEW: Loaded blank view at index: ${currentViewIndex}`);
        console.log(`LOAD VIEW: No canvas state to load for index: ${currentViewIndex} (blank view)`); // Indicate blank load
    }
}


function saveCurrentView() {
    views[currentViewIndex] = proofCreatorCanvas.toJSON();
    console.log(`SAVE VIEW: Saved state of view index: ${currentViewIndex}`);
    console.log(`SAVE VIEW: Number of objects on canvas when saved: ${proofCreatorCanvas.getObjects().length}`); // Log object count at save time
    console.log(`SAVE VIEW: Saved canvas state (first 50 chars): ${JSON.stringify(views[currentViewIndex]).substring(0, 50)}...`); // Log start of JSON
}


// --- Customer Search and Selection ---
function setupCustomerSearch() {
    const searchInput = document.getElementById('search-customers-input');
    const clearButton = document.getElementById('clear-customers-search-button');

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        filterCustomerList(searchTerm);
        clearButton.style.display = searchTerm ? 'inline-block' : 'none';
    });

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        filterCustomerList('');
        clearButton.style.display = 'none';
    });
}

async function populateCustomerList() {
    const customerList = document.getElementById('customer-list');
    customerList.innerHTML = ''; // Clear existing list

    try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const customers = await response.json();

        customers.forEach(customer => {
            const listItem = document.createElement('li');
            listItem.textContent = customer.name;
            listItem.dataset.customerId = customer.id; // Store customer ID
            listItem.onclick = () => selectCustomer(customer.id, customer.name); // Add click handler
            customerList.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error fetching customers:', error);
        customerList.innerHTML = `<li>Error loading customers: ${error.message}</li>`;
    }
}

function filterCustomerList(searchTerm) {
    const customerListItems = document.querySelectorAll('#customer-list li');
    customerListItems.forEach(item => {
        const customerName = item.textContent.toLowerCase();
        item.style.display = customerName.includes(searchTerm) ? '' : 'none';
    });
}

function selectCustomer(customerId, customerName) {
    console.log(`Selected customer: ${customerName} (ID: ${customerId})`);
    // Remove 'selected' class from all list items
    const customerListItems = document.querySelectorAll('#customer-list li');
    customerListItems.forEach(li => li.classList.remove('selected'));

    //add the class to a selected customer
    const selectedListItem = document.querySelector(`#customer-list li[data-customer-id="${customerId}"]`);
    if (selectedListItem) {
        selectedListItem.classList.add('selected');
    }

    selectedCustomer = customerId;
    selectedLogos = []; // Clear previously selected logos
    updateSelectedLogosDisplay(); // Clear displayed logos

    // Fetch and display the logos for the selected customer
    fetchCustomerLogos(customerId);
}


// --- Populate Logo List ---

function fetchCustomerLogos(customerId) {
    const logoList = document.getElementById('selected-logos-list');
    logoList.innerHTML = ''; // Clear the list

        fetch(`/api/customers`) //fetch all customers
        .then(response => response.json())
        .then(customers => {
            const customer = customers.find(c => c.id === customerId); //find the customer
            if (customer && customer.logos) { //if the customer has logos
              customer.logos.forEach(logo => {
                const listItem = document.createElement('li');
                listItem.textContent = logo.logoName || 'Unnamed Logo';
                listItem.setAttribute('data-logo-url', logo.logoUrl); // Store URL as data attribute
                listItem.onclick = () => addLogoToCanvas(logo.logoUrl, logo.logoName);
                logoList.appendChild(listItem);
               });
            } else {
                logoList.innerHTML = '<li>No logos available for this customer.</li>';
            }
        })
        .catch(error => {
            console.error('Error fetching customer logos:', error);
            logoList.innerHTML = '<li>Error loading logos.</li>';
        });
}

// --- Add Logo to Canvas ---
function addLogoToCanvas(logoUrl, logoName) {
    console.log(`Adding logo to canvas: ${logoUrl} (${logoName})`);

    // Use the HIGH-RESOLUTION canvas dimensions
    const canvasWidth = CANVAS_WIDTH;
    const canvasHeight = CANVAS_HEIGHT;

    if (logoUrl.toLowerCase().endsWith('.svg')) {
        fabric.loadSVGFromURL(logoUrl, (objects, options) => {
            const logoImg = fabric.util.groupSVGElements(objects, options);

            // Calculate scale to fit within, say, 20% of the canvas
            const scale = Math.min(0.2, (canvasWidth * 0.2) / logoImg.width, (canvasHeight * 0.2) / logoImg.height);

            logoImg.set({
                left: canvasWidth / 2,    // Center by default
                top: canvasHeight / 2,
                scaleX: scale,  // Use calculated scale
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                selectable: true, // Make logos selectable so they can be deleted
            });
            proofCreatorCanvas.add(logoImg);
            proofCreatorCanvas.renderAll();
        }, null, { crossOrigin: 'anonymous' });

    } else {
        fabric.Image.fromURL(logoUrl, (logoImg) => {
            // Calculate scale to fit within a reasonable portion of the canvas
             const scale = Math.min(0.2, canvasWidth * 0.2 / logoImg.width, canvasHeight * 0.2 / logoImg.height);
            logoImg.set({
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                selectable: true, // Make logos selectable so they can be deleted
            });
            proofCreatorCanvas.add(logoImg);
            proofCreatorCanvas.renderAll();
        }, { crossOrigin: 'anonymous' });
    }
}


// --- Garment Image Upload ---

function setupGarmentImageUpload() {
  const garmentImageInput = document.getElementById('garment-image-input');
  garmentImageInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleGarmentImage(files[0]);
    }
  });
}


function handleGarmentImage(file) {
    console.log("handleGarmentImage called with file:", file); // Debug log

    if (!file) {
        console.warn("handleGarmentImage called without a file.");
        return; // Exit if no file is provided
    }

    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        console.log("FileReader onload event triggered."); // Debug log

        fabric.Image.fromURL(e.target.result, (img) => {
            console.log("fabric.Image.fromURL callback executed. Image:", img); // Debug log

            if (!img) { //image failed to load
              console.error("Failed to load image onto canvas");
              return;
            }

            // Calculate scaling.  Use the *high-resolution* dimensions.
            const canvasWidth = proofCreatorCanvas.getWidth();  // This is CANVAS_WIDTH
            const canvasHeight = proofCreatorCanvas.getHeight(); // This is CANVAS_HEIGHT
            const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height, 1);

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: (canvasWidth - img.width * scale) / 2, // Center horizontally
                top: (canvasHeight - img.height * scale) / 2, // Center vertically
                selectable: false // Garment image should NOT be selectable/movable
            });

            saveCurrentView(); // Save canvas state *before* background change
            proofCreatorCanvas.setBackgroundImage(img, proofCreatorCanvas.renderAll.bind(proofCreatorCanvas));
            saveCurrentView(); // Save canvas state *again* AFTER background change
            loadCurrentView(); // Load the updated view
            console.log("Image set as background. Canvas dimensions:", proofCreatorCanvas.width, proofCreatorCanvas.height); //debug

        }, { crossOrigin: 'anonymous' }); // Important for loading from Data URL
    };

    reader.onerror = (error) => { // ADDED ERROR HANDLING FOR FileReader
      console.error("FileReader error:", error);
      alert('Error loading image file. Please check the console.');
    }

    reader.readAsDataURL(file);
    console.log("FileReader reading file as Data URL."); // Debug log
}


function removeLogoFromList(listItem, logoUrl) {
     // Remove from the selectedLogos array
    selectedLogos = selectedLogos.filter(url => url !== logoUrl);

     // Remove from the displayed list
    listItem.remove();

    // Remove from the canvas
    proofCreatorCanvas.getObjects().forEach(obj => {
        if (obj.getSrc && obj.getSrc() === logoUrl) { // Check if src exists before comparing
            proofCreatorCanvas.remove(obj);
        }
    });
    proofCreatorCanvas.renderAll();
}


function updateSelectedLogosDisplay() {
  const logoList = document.getElementById('selected-logos-list');
  logoList.innerHTML = ''; // Clear current list

   selectedLogos.forEach(logoUrl => {
       const listItem = document.createElement('li');
       // Use URL to create a unique ID - replace slashes for valid ID
        const logoId = logoUrl.replace(/\//g, '_').replace(/\./g, '_');
       listItem.id = `logo-item-${logoId}`;

        // Create and append the remove button
       const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeLogoFromList(listItem, logoUrl);
      listItem.appendChild(removeButton);

       logoList.appendChild(listItem); // Append the list item to the <ul>
    });
}

// --- Submit Proof (Corrected PDF Generation) ---

function submitProof() {
    saveCurrentView();

    if (!selectedCustomer) {
        alert("Please select a customer first.");
        return;
    }

    const canvasDataURLs = [];
    console.log("Views array before DataURL generation:", views);

    const dataURLPromises = views.map((viewState, index) => {
        return new Promise(resolve => {
            console.log(`Generating DataURL for view index: ${index}`);

            const tempCanvasForView = new fabric.Canvas(null, {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: '#ffffff'
            });

            tempCanvasForView.loadFromJSON(viewState, () => {
                console.log(`loadFromJSON callback for view index: ${index} STARTED`);

                // 1. Reset viewport (important for consistency)
                tempCanvasForView.viewportTransform = [1, 0, 0, 1, 0, 0];
                tempCanvasForView.setZoom(1);

                // 2. Scale up objects for PDF
                tempCanvasForView.getObjects().forEach(obj => {
                    obj.set({
                        scaleX: obj.scaleX * SCALE_FACTOR,
                        scaleY: obj.scaleY * SCALE_FACTOR,
                        left: obj.left * SCALE_FACTOR,
                        top: obj.top * SCALE_FACTOR
                    });
                    obj.setCoords(); // VERY IMPORTANT: Update object coordinates after scaling
                });

              // 3. Scale up background image (if any)
                if (tempCanvasForView.backgroundImage) {
                    tempCanvasForView.backgroundImage.set({
                        scaleX: tempCanvasForView.backgroundImage.scaleX * SCALE_FACTOR,
                        scaleY: tempCanvasForView.backgroundImage.scaleY * SCALE_FACTOR,
                         width: tempCanvasForView.backgroundImage.width * SCALE_FACTOR, //scale width and height too
                        height: tempCanvasForView.backgroundImage.height * SCALE_FACTOR,
                        // No need to adjust left/top for background image if centered
                    });
                }

                tempCanvasForView.renderAll(); // Render after scaling

                // 4. NOW get the Data URL
                const dataURL = tempCanvasForView.toDataURL('png');
                console.log(`DataURL generated for view index: ${index}: ${dataURL.substring(0, 50)}...`);

                canvasDataURLs.push(dataURL);
                resolve();
                tempCanvasForView.dispose();
                console.log(`loadFromJSON callback for view index: ${index} ENDED`);
            });
        });
    });

    // ... (rest of your submitProof function remains the same) ...
    Promise.all(dataURLPromises).then(() => {
        const garmentCode = document.getElementById('garment-code').value;
        const proofDescription = document.getElementById('proof-description').value;

        if (!garmentCode) {
            alert("Please enter a garment code.");
            return;
        }

        const proofData = {
            customerId: selectedCustomer,
            canvasDataURLs: canvasDataURLs, // Now sending array of DataURLs
            garmentCode: garmentCode,
            proofDescription: proofDescription
        };

        console.log("Submitting proof data with Data URLs:", proofData);

        fetch(`/api/customers/${selectedCustomer}/generate-proof`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(proofData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Create a Blob URL
            const pdfUrl = URL.createObjectURL(blob);

            // Create a temporary link element
            const downloadLink = document.createElement('a');
            downloadLink.href = pdfUrl;
            downloadLink.download = `customer_proof_${selectedCustomer}.pdf`; // Suggest filename
            document.body.appendChild(downloadLink); // Append to body (required for FF)
            downloadLink.click(); // Programmatically click the link to trigger download
            downloadLink.remove(); // Clean up by removing the link

            URL.revokeObjectURL(pdfUrl); // Revoke the Blob URL to free resources

            alert("PDF Proof downloaded successfully!"); // Success alert

        })
        .catch(error => {
            console.error('Error submitting proof:', error);
            alert(`Failed to submit proof: ${error.message}`);
        });
    });
}

// Zoom In function
function zoomIn() {
      zoomLevel = proofCreatorCanvas.getZoom();
      zoomLevel += ZOOM_INCREMENT;
    proofCreatorCanvas.zoomToPoint({ x: proofCreatorCanvas.getWidth() / 2, y: proofCreatorCanvas.getHeight() / 2 }, zoomLevel);
}

// Zoom Out function
function zoomOut() {
    zoomLevel = proofCreatorCanvas.getZoom();
      zoomLevel -= ZOOM_INCREMENT;
    proofCreatorCanvas.zoomToPoint({ x: proofCreatorCanvas.getWidth() / 2, y: proofCreatorCanvas.getHeight() / 2 }, zoomLevel);
}

// Reset Zoom function
function resetZoom() {
  zoomLevel = 1;
    proofCreatorCanvas.setZoom(1);
    proofCreatorCanvas.viewportTransform = [1, 0, 0, 1, 0, 0]; // Reset viewport transform
    proofCreatorCanvas.renderAll();
}

function deleteActiveObject() {
    const activeObject = proofCreatorCanvas.getActiveObject(); // Get the currently selected object
    if (activeObject) {
        proofCreatorCanvas.remove(activeObject); // Remove it from canvas
        saveCurrentView(); // Save canvas state *after* deletion
        proofCreatorCanvas.discardActiveObject().renderAll(); // Deselect and re-render
        console.log('Deleted selected object from canvas.');
    } else {
        console.log('No object selected to delete.');
    }
}