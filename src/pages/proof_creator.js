

// proof_creator.js
/**
 * @global
 * @type {object}
 */
var fabric; // Declare fabric as a global variable
let proofCreatorCanvas;
let selectedCustomer = null;
let selectedLogos = [];
let logoFiles = []; // NEW: Array to store actual logo FILE objects
let zoomLevel = 1;
const ZOOM_INCREMENT = 0.2;
let panning = false;
let lastPosX = 0;
let lastPosY = 0;
let views = []; // Array to store canvas states (each view is a canvas state as JSON)
let currentViewIndex = 0;


document.addEventListener('DOMContentLoaded', () => {
    proofCreatorCanvas = new fabric.Canvas('proof-canvas', {
        backgroundColor: '#ffffff',
        selection: true // Enable object selection
    });
    views.push({}); // Initialize views array with one empty view

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



    // Add the Generate PDF button and event listener.  Place this *after* the DOMContentLoaded
    const generatePdfButton = document.createElement('button');
    generatePdfButton.textContent = "Generate PDF";
    generatePdfButton.id = "generate-pdf-button";
    generatePdfButton.addEventListener('click', generateProofPDF); // Call the generate function

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container'; // Optional class for styling
    buttonContainer.appendChild(generatePdfButton);
    document.querySelector('.right-column').appendChild(buttonContainer); // Append *after* the canvas wrapper
  
  
  

    // --- Mouse wheel zoom ---
    proofCreatorCanvas.on('mouse:wheel', function(opt) {
        var delta = opt.e.deltaY;
        var zoom = proofCreatorCanvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.1) zoom = 0.1;
        proofCreatorCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
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

    // const submitProofButton = document.getElementById('submit-proof-button');
    // submitProofButton.addEventListener('click', submitProof);
  



    updateCarousel(); // Initialize carousel indicators
    loadCurrentView(); // Load the initial view (first in the array) - LOAD AFTER updateCarousel to fix indicator highlighting
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
    // loadCurrentView(); // Removed this line as requested - loadCurrentView is called in switchToView
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
    proofCreatorCanvas.clear(); // Clear canvas - ALREADY PRESENT
    if (viewState) {
        proofCreatorCanvas.loadFromJSON(viewState, () => {
            proofCreatorCanvas.renderAll();
            console.log(`loadCurrentView: Loaded view at index: ${currentViewIndex}`); // ADDED LOG
        });
    } else {
        proofCreatorCanvas.setBackgroundImage(null, proofCreatorCanvas.renderAll.bind(proofCreatorCanvas));
        console.log(`loadCurrentView: Loaded blank view at index: ${currentViewIndex}`); // ADDED LOG
    }
}


function saveCurrentView() {
    views[currentViewIndex] = proofCreatorCanvas.toJSON();
    console.log(`saveCurrentView: Saved state of view index: ${currentViewIndex} - objects: ${proofCreatorCanvas.getObjects().length}`); // ADDED LOG - Log object count
    console.log("saveCurrentView: views array after saveCurrentView:", views); // ADDED LOG - Inspect views array
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
function addLogoToCanvas(logoUrl, logoName, file) { // Add 'file' parameter
    console.log(`Adding logo to canvas: ${logoUrl} (${logoName})`);

    const canvasWidth = proofCreatorCanvas.getWidth();
    const canvasHeight = proofCreatorCanvas.getHeight();

     if (file && !logoFiles.find(f => f.name === file.name)) { // Check if it's already stored.  Use filename for comparison.
      logoFiles.push(file); // Store the actual File object
    }

    if (logoUrl.toLowerCase().endsWith('.svg')) {
      fabric.loadSVGFromURL(logoUrl, (objects, options) => {
        const logoImg = fabric.util.groupSVGElements(objects, options);
          logoImg.set({
                left: canvasWidth / 2,    // Center by default
                top: canvasHeight / 2,
                scaleX: 0.5, // Fixed scale for now - try 0.5
                scaleY: 0.5,
                originX: 'center',
                originY: 'center',
                selectable: true, // Make logos selectable so they can be deleted
            });
        proofCreatorCanvas.add(logoImg);
        proofCreatorCanvas.renderAll();
    }, null, { crossOrigin: 'anonymous' });

    }
    else
    {
      fabric.Image.fromURL(logoUrl, (logoImg) => {
          const scale = Math.min(0.2, canvasWidth / logoImg.width, canvasHeight/logoImg.height);
        logoImg.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          scaleX: scale, // Use the calculated scale factor.
          scaleY: scale,
          originX: 'center',
          originY: 'center',
           selectable: true,
        });
        proofCreatorCanvas.add(logoImg);
        proofCreatorCanvas.renderAll();

      }, { crossOrigin: 'anonymous' });
    }
}

function getCanvasImageData(canvas, quality = 0.9) { // Add quality parameter
    return canvas.toDataURL({
        format: 'jpeg', // Use JPEG for smaller size
        quality: quality   // 0.9 is a good balance between quality and size (range 0.0 - 1.0)
    });
}


// --- Function to Generate PDF (Client-Side) ---
async function generateProofPDF() {
    console.log("generateProofPDF called"); // Debug log

    if (!selectedCustomer) {
        alert("Please select a customer first.");
        return;
    }

     // Get Customer Details
      const customerResponse = await fetch('/api/customers');
        if (!customerResponse.ok) {
            console.error("Failed to fetch customer list for populating modal.");
            return;
        }
        const customerData = await customerResponse.json();
      const customer = customerData.find(c => c.id === selectedCustomer);

        if (!customer) {
            console.error(`Customer with ID ${selectedCustomer} not found!`);
            return;
        }

      const customerName = customer.name;
    const customerEmail = customer.email;
    const contactPerson = customer.contactPerson;

    // Collect Proof Details
    const garmentCode = document.getElementById('garment-code').value.trim();
    const proofDescription = document.getElementById('proof-description').value.trim();

    if (!garmentCode) {
        alert("Please enter a Garment Code.");
        return;
    }

    // Get Canvas Data (all views)
    saveCurrentView(); // Make sure the *current* view is saved
    const canvasImages = views.map(view => {
        // Create a temporary canvas to load the JSON onto
        const tempCanvas = new fabric.Canvas();
        tempCanvas.loadFromJSON(view, () => { // Use loadFromJSON's callback
          tempCanvas.renderAll(); // Make *SURE* it's rendered before converting.
        });

        // Convert the temporary canvas to a data URL (image)
        return getCanvasImageData(tempCanvas); // Use helper function, default JPEG 90% quality.
    });

    // Prepare the data for the server.  Include EVERYTHING.
    const pdfData = {
        customerId: selectedCustomer,
        customerName: customerName,
        customerEmail: customerEmail,
        contactPerson: contactPerson,
        garmentCode,
        proofDescription,
        canvasImages,  // Array of data URLs (images)
        logos: logoFiles // Array of File objects
    };

    console.log("Sending PDF data to server:", pdfData); // Very important to check this.

    try {
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // DON'T set multipart/form-data here.  We're sending JSON.
            },
            body: JSON.stringify(pdfData) // Send ALL the data as JSON
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // Handle PDF Download
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `proof_${selectedCustomer}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
    }
}


// --- Garment Image Upload ---

function setupGarmentImageUpload() {
  const garmentImageInput = document.getElementById('garment-image-input');
  garmentImageInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // You could handle multiple files here if you want
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

            // Calculate scaling. We want to fit the image *within* the canvas
            const canvasWidth = proofCreatorCanvas.getWidth();
            const canvasHeight = proofCreatorCanvas.getHeight();
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
            loadCurrentView();
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
// --- Submit Proof (Placeholder) ---

// proof_creator.js



// Zoom In function
function zoomIn() {
     zoomLevel = proofCreatorCanvas.getZoom();
    zoomLevel = Math.min(zoomLevel + ZOOM_INCREMENT, 5); // Limit zoom to 5x
    proofCreatorCanvas.zoomToPoint({ x: proofCreatorCanvas.getWidth() / 2, y: proofCreatorCanvas.getHeight() / 2 }, zoomLevel);
}

// Zoom Out function
function zoomOut() {
     zoomLevel = proofCreatorCanvas.getZoom();
    zoomLevel = Math.max(zoomLevel - ZOOM_INCREMENT, 0.2); // Limit zoom out to 0.2x
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


