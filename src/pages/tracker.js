// src/pages/tracker.js

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Element Variables ---
  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const fileButton = document.getElementById('fileButton');
  const tableBody = document.querySelector('#orders-table tbody');
  const searchInput = document.getElementById('search-input');
  const clearSearchButton = document.getElementById('clear-search-button');
  const sidebar = document.getElementById('sidebar');
  const toggleSidebarButton = document.getElementById('toggle-sidebar');
  const deleteArea = document.getElementById('delete-area');


    // --- Functions from your previous script.js ---
    // Include the hexToRgb, calculateColorMatchScore functions here...
    // ... (all helper functions from the previous script.js files)
function hexToRgb(hex) {
  if (!hex) return null;
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex[0]+hex[0] + hex[1]+hex[1] + hex[2]+hex[2];
  }
  if (hex.length !== 6) return null;
  const num = parseInt(hex, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: (num & 255)
  };
}

  // --- Event Listeners ---
  fileButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', handleFile);
  dropArea.addEventListener('dragover', handleDragOver);
  dropArea.addEventListener('drop', handleFileDrop);
  dropArea.addEventListener('dragleave', handleDragLeave); // Add dragleave
  searchInput.addEventListener('input', handleSearchInput);
  clearSearchButton.addEventListener('click', clearSearch);
    toggleSidebarButton.addEventListener('click', toggleSidebar);


  // --- Drag-and-Drop Handlers (Same as before, plus dragleave) ---
  function handleDragOver(evt) {
    evt.preventDefault();
    dropArea.classList.add('dragover');
    deleteArea.style.display = 'block';  // Show the delete area
  }

   function handleDragLeave(evt) { // Corrected event handler for dragleave
      evt.preventDefault();
      dropArea.classList.remove('dragover');
    }


  function handleFileDrop(evt) {
    evt.preventDefault();
    dropArea.classList.remove('dragover');
    const files = evt.dataTransfer.files;
    handleFiles(files);
  }

  function handleFile(evt) {
    const files = fileInput.files;
    handleFiles(files);
  }

   async function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
              const reader = new FileReader();

                reader.onload = function(event) {
                    const csvText = event.target.result;
                    parseCSVData(csvText); // Call a new function to parse the CSV data
                };

                reader.onerror = function(error) {
                    console.error("Error reading CSV file:", error);
                    alert('Error reading CSV file.');
                };

                reader.readAsText(file);

            } else {
                alert('Invalid file type. Please upload a CSV file.');
            }
        }
    }

   // --- Data Processing and Display ---
  async function parseCSVData(csvText) {
     try {
         const response = await fetch('/api/upload-orders', {
             method: 'POST',
             headers: {
                 'Content-Type': 'text/csv'
             },
             body: csvText
         });

         if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
         }

         const data = await response.json();
         console.log('Parsed CSV data received from server:', data);
         // alert('CSV file processed and data received from server! Table will now update.');

         fetchOrderData();  // Fetch and display data after successful upload
         displaySummaryCards(data); // Display the summary cards

     } catch (error) {
         console.error('Error sending CSV data to server:', error);
         alert('Error processing CSV file.');
     }
  }

    async function fetchOrderData() {
        try {
            const response = await fetch('/api/active-orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Order data fetched:', data);

            // Filter orders to only show those with a status that is NOT 'Completed'
            const activeOrders = data.filter(order => order.status !== "Completed");

            displayOrderData(activeOrders); // Pass only active orders to display
        } catch (error) {
            console.error('Error fetching order data:', error);
            alert('Failed to load order data.');
        }
    }

 function displayOrderData(orders) {
    const tableBody = document.querySelector('#orders-table tbody');
    tableBody.innerHTML = ''; // Clear existing table rows

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="14" style="text-align:center;">No active orders found.</td></tr>`;  // Updated colspan
        return;
    }

    orders.forEach(order => {
      const row = tableBody.insertRow();
      //Make row draggable
      row.draggable = true;
      row.dataset.sord = order.SORD; // Set SORD as a data attribute
      row.addEventListener('dragstart', handleDragStart);

      // Add cells, mapping data correctly
      row.insertCell().textContent = order.SORD;
      row.insertCell().textContent = order["Trader Code"];
      row.insertCell().textContent = order["Trader Name"];
      row.insertCell().textContent = order["Total Items"];
      row.insertCell().textContent = order["Ordered Date"];
      row.insertCell().textContent = order["Due Date"];
      row.insertCell().textContent = order["Total Logos"];
    });
}


  // --- Initial Data Load ---
  fetchOrderData();

  // --- Search Functionality ---

  function handleSearchInput() {
    const searchTerm = searchInput.value.toLowerCase();
    filterOrderTable(searchTerm);
    updateClearSearchButtonVisibility();
  }

  function clearSearch() {
    searchInput.value = '';
    filterOrderTable('');
    updateClearSearchButtonVisibility();
  }

  function updateClearSearchButtonVisibility() {
    clearSearchButton.style.display = searchInput.value ? 'inline-block' : 'none';
  }

  function filterOrderTable(searchTerm) {
    const rows = tableBody.querySelectorAll('tr'); // Get all rows in the table body

    rows.forEach(row => {
      let rowText = row.textContent.toLowerCase(); // Get the text content of the entire row

      if (rowText.includes(searchTerm)) {
        row.style.display = ''; // Show row if it contains the search term
      } else {
        row.style.display = 'none'; // Hide row if it doesn't match
      }
    });
  }

  // --- Sidebar Toggle ---

  function toggleSidebar() {
      sidebar.classList.toggle('collapsed');
      const icon = toggleSidebarButton.querySelector('i');
      icon.classList.toggle('fa-chevron-left');
      icon.classList.toggle('fa-chevron-right');
  }

  // --- Sorting ---
  function attachSortListeners() {
    const headers = document.querySelectorAll('#orders-table th.sortable');
    headers.forEach(header => {
        header.addEventListener('click', () => handleSort(header));
    });
}

  let currentSort = { key: null, order: 'asc' }; // Initialize sorting state

  function handleSort(header) {
    const key = header.dataset.sort;
      if (currentSort.key === key) {
          currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
      } else {
      currentSort.key = key;
      currentSort.order = 'asc';
    }

      sortOrderData(currentSort.key, currentSort.order); // Sort the data and re-display
      updateSortIndicators();
  }

 function sortOrderData(key, order) {
    console.log("Sorting by:", key, order); // Log the sort key and order

    // 1. Fetch the current data. We'll assume `fetchOrderData` populates a global
    //    variable `orderData`.
    fetch('/api/active-orders') // Use the correct endpoint
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(orderData => {
          console.log("Original orderData before sort:", orderData);

          // 2. Sort the data.
          orderData.sort((a, b) => {
              const aValue = a[key] ?? ''; // Use empty string for null/undefined
              const bValue = b[key] ?? '';

              let comparison = 0;
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue; // Numerical comparison
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
              comparison = aValue.localeCompare(bValue); // String comparison
            }

            return order === 'asc' ? comparison : -comparison;
            });
          console.log("Sorted orderData:", orderData);

            // 3. Re-display the data.
          displayOrderData(orderData);

        }).catch(error => {
            console.error('Error fetching or sorting order data:', error);
        });
    }

    function updateSortIndicators() {
    const headers = document.querySelectorAll('#orders-table th.sortable');

    headers.forEach(header => {
        const sortKey = header.dataset.sort;

        // Remove existing sort classes
        header.classList.remove('sorted-asc', 'sorted-desc');
        // Remove existing icon
        const existingIcon = header.querySelector('.sort-indicator i');
        if (existingIcon) {
            existingIcon.remove();
        }

        // If this is the currently sorted column, add the correct class and icon
        if (sortKey === currentSort.key) {
            const icon = document.createElement('i');
            icon.classList.add('fas');
            if (currentSort.order === 'asc') {
                header.classList.add('sorted-asc');
                icon.classList.add('fa-sort-up');  // Font Awesome up-arrow
            } else {
                header.classList.add('sorted-desc');
                icon.classList.add('fa-sort-down'); // Font Awesome down-arrow
            }
            header.querySelector('.sort-indicator').appendChild(icon);
        }
    });
}
  
  function handleDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.dataset.sord); // Store SORD on drag
    deleteArea.style.display = 'block'; // Make delete area visible
}

  // --- Drag and Drop for DELETE ---
  deleteArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    deleteArea.classList.add('active');
  });

  deleteArea.addEventListener('dragleave', () => {
    deleteArea.classList.remove('active');
  });

  deleteArea.addEventListener('drop', async (event) => {
    event.preventDefault();
    deleteArea.classList.remove('active');
    const sordToDelete = event.dataTransfer.getData('text/plain');
    console.log("Drop Event - SORD to Delete:", sordToDelete);  // Log SORD

    if (confirm(`Are you sure you want to delete order ${sordToDelete}?`)) {
        try {
            const response = await fetch(`/api/delete-order/${sordToDelete}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            // Remove row from table (optional, if you want to instantly reflect the change)
          const rowToDelete = document.querySelector(`#orders-table tbody tr[data-sord="${sordToDelete}"]`);
              if (rowToDelete) {
                rowToDelete.remove();
             }

            alert(`Order ${sordToDelete} deleted successfully.`);
            // Fetch and display updated data.
            fetchOrderData();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert(`Error deleting order: ${error.message}`);
        }
    }
    deleteArea.style.display = 'none';
  });

   // --- Summary Card Functions ---
    function displaySummaryCards(orders) {
        const cardsContainer = document.getElementById('summary-cards');
        cardsContainer.innerHTML = ''; // Clear previous cards

        const totalJobs = orders.length;
        const totalItems = orders.reduce((sum, order) => sum + (parseInt(order['Total Items'], 10) || 0), 0);

       const totalLogos = orders.reduce((total, order) => total + (parseInt(order['Total Logos'], 10) || 0), 0);

        // Create Total Jobs Card
        const totalJobsCard = document.createElement('div');
        totalJobsCard.classList.add('card');
        totalJobsCard.innerHTML = `<h3>Total Jobs</h3><p>${totalJobs}</p>`;
        cardsContainer.appendChild(totalJobsCard);

        // Create Total Items Card
        const totalItemsCard = document.createElement('div');
        totalItemsCard.classList.add('card');
        totalItemsCard.innerHTML = `<h3>Total Items</h3><p>${totalItems}</p>`;
        cardsContainer.appendChild(totalItemsCard);

        const totalLogosCard = document.createElement('div');
        totalLogosCard.classList.add('card');
        totalLogosCard.innerHTML = `<h3>Total Logos</h3><p>${totalLogos}</p>`;
        cardsContainer.appendChild(totalLogosCard);

    }
  
  
  // --- INITIALIZATION ---

  // Call attachSortListeners when the DOM is ready
    attachSortListeners();
  
  
  // --- Utility Functions ---
  function normalisePantoneCode(pantoneCode = "") {
  return pantoneCode.replace(/^pantone\s*\+?/i, "").trim();
}
});