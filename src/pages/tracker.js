// src/pages/tracker.js
document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileButton = document.getElementById('fileButton');
    const sidebar = document.getElementById('sidebar'); // Get sidebar element
    const closeSidebarButton = document.getElementById('close-sidebar-button');
    const searchInput = document.getElementById('search-input'); // Get search input
    const clearSearchButton = document.getElementById('clear-search-button');
    const tableBody = document.querySelector('#orders-table tbody'); //get the table

    fileButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFile);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('drop', handleFileDrop);

        function handleDragOver(evt) {
        evt.preventDefault();
        dropArea.classList.add('dragover');
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

    function handleFiles(files) {
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

    async function parseCSVData(csvText) {
    try {
        const response = await fetch('/api/upload-orders', { // NEW API ENDPOINT URL
            method: 'POST',
            headers: {
                'Content-Type': 'text/csv' // Tell the server we're sending CSV text
            },
            body: csvText
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json(); // Expecting JSON array back from the server
        console.log('Parsed CSV data received from server:', data);
        alert('CSV file processed and data received from server! Table will now update.'); // Alert

       fetchOrderData();

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
        displayOrderData(data); // Call function to display data in the table

    } catch (error) {
        console.error('Error fetching order data:', error);
        alert('Failed to load order data.');
    }
}

    function displayOrderData(orders) {
    const tableBody = document.querySelector('#orders-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    if (!orders || orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="27" style="text-align:center;">No active orders found.</td></tr>`;  //adjust the colspan if you have less or more columns.
        return;
    }

    orders.forEach(order => {
        const row = tableBody.insertRow();

        // Helper function to add a cell with text content
        const addCell = (textContent) => {
            const cell = row.insertCell();
            cell.textContent = textContent || ''; // Handle null/undefined
        };

        addCell(order.SORD);
        addCell(order["Trader Code"]); // Use bracket notation for properties with spaces
        addCell(order["Trader Name"]);
        addCell(order["Total Items"]);
        addCell(order["Ordered Date"]);
        addCell(order["Due Date"]);
        addCell(order["Total Logos"]);
        // Add a placeholder cell for the delete button (for now, just visual)
        const deleteCell = row.insertCell();
        deleteCell.className = 'delete-column'; // Add a class for styling
        deleteCell.innerHTML = '<button class="delete-order-button">Delete</button>'; // Placeholder button
    });

      attachDeleteButtonListeners();
}

// Close sidebar when the close button is clicked
closeSidebarButton.addEventListener('click', () => {
  sidebar.classList.add('closed');
});

// Open sidebar when you click anywhere else on the page
document.addEventListener('click', (event) => {
  if (!sidebar.contains(event.target) && !event.target.matches('#fileButton, #fileButton *')) { //if clicked outside of sidebar
    sidebar.classList.remove('closed');
  }
});
// Search input event listener
searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    filterTable(searchTerm);
    updateClearSearchButtonVisibility();
});

clearSearchButton.addEventListener('click', () => {
    searchInput.value = '';
    filterTable('');
    clearSearchButton.style.display = 'none';
});

function updateClearSearchButtonVisibility() {
    clearSearchButton.style.display = searchInput.value.length > 0 ? 'inline-block' : 'none';
}

//filter function

function filterTable(searchTerm) {
    const rows = tableBody.querySelectorAll('tr'); //select all rows
    rows.forEach(row => {
    const rowText = row.textContent.toLowerCase();
    row.style.display = rowText.includes(searchTerm) ? '' : 'none'; //show or hide based on text
    });
}

//sorting logic
    document.querySelectorAll('#orders-table th[data-sort-key]').forEach(header => {
        header.addEventListener('click', () => {
          const sortKey = header.getAttribute('data-sort-key');
          let sortOrder = 'asc'; // Default to ascending

          // Toggle sort order if already sorting by this column
          if (header.classList.contains('sorted-asc')) {
                sortOrder = 'desc';
              header.classList.remove('sorted-asc');
              header.classList.add('sorted-desc');
            } else if (header.classList.contains('sorted-desc')) {
              sortOrder = 'asc';
              header.classList.remove('sorted-desc');
                header.classList.add('sorted-asc');
            } else { //if neither, add the sort
            // Remove sort classes from other headers
            document.querySelectorAll('#orders-table th[data-sort-key]').forEach(h => {
                h.classList.remove('sorted-asc', 'sorted-desc');
            });
                header.classList.add('sorted-asc');
            }
            sortTable(sortKey, sortOrder);
        });
});

function sortTable(key, order) {
    const tbody = document.querySelector('#orders-table tbody');
    const rows = Array.from(tbody.querySelectorAll('tr')); // Convert NodeList to Array

    rows.sort((rowA, rowB) => {
      let aVal = rowA.cells[getHeaderIndex(key)].textContent.trim();
      let bVal = rowB.cells[getHeaderIndex(key)].textContent.trim();

    // Convert values to numbers if they appear to be numeric, otherwise, convert to lowercase strings
    aVal = !isNaN(parseFloat(aVal)) && isFinite(aVal) ? parseFloat(aVal) : aVal.toLowerCase();
    bVal = !isNaN(parseFloat(bVal)) && isFinite(bVal) ? parseFloat(bVal) : bVal.toLowerCase();

    if (aVal < bVal) {
      return order === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
        return order === 'asc' ? 1 : -1;
     }
      return 0;
    });

    // Re-append sorted rows to tbody
    rows.forEach(row => tbody.appendChild(row)); //re-adds them in the right order
}

//helper for sorting to get column
function getHeaderIndex(key) {
  const headerRow = document.querySelector('#orders-table thead tr');
  for (let i = 0; i < headerRow.cells.length; i++) {
      if (headerRow.cells[i].getAttribute('data-sort-key') === key) {
          return i;
        }
    }
   return -1; //shouldnt happen, but...
}


  function attachDeleteButtonListeners() { //find delete buttons, attach listeners
    document.querySelectorAll('.delete-order-button').forEach(button => {
        button.addEventListener('click', function(event) {
            const row = this.closest('tr');
            const sord = row.querySelector('td:first-child').textContent; // Assumes SORD is first
            openDeleteModal(sord, row);
        });
    });
}

function openDeleteModal(sord, rowToDelete) {
    const modal = document.getElementById('deleteConfirmationModal');
    modal.style.display = 'flex';
    modal.dataset.sord = sord; // Store SORD to delete in the modal's dataset.  CRUCIAL
    modal.dataset.rowToDelete = rowToDelete;
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmationModal');
    modal.style.display = 'none';
    delete modal.dataset.sord; // Clear SORD data
}


// Function to actually delete the order - INCOMPLETE - Add later

async function confirmDeletion() {
    const modal = document.getElementById('deleteConfirmationModal');
    const sordToDelete = modal.dataset.sord; // Get SORD to delete
    const row = document.getElementById(sordToDelete)
    console.log(`Deleting order with SORD: ${sordToDelete}`);

    if (!sordToDelete) {
        console.error('No SORD found to delete.');
        closeDeleteModal();
        return;
    }
  
    closeDeleteModal();

     // Make the DELETE request to your server here (Implementation below).
}


// Drag and Drop Delete - Placeholder, just visual effect
const deleteDropZone = document.getElementById('delete-drop-zone');

tableBody.addEventListener('dragstart', (event) => {
    const row = event.target.closest('tr');
    if (row) {
        event.dataTransfer.setData('text/plain', row.id); // Store row ID for deletion
        deleteDropZone.classList.add('drag-target');
    }
});

deleteDropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    deleteDropZone.classList.add('dragover');
});

deleteDropZone.addEventListener('dragleave', () => {
    deleteDropZone.classList.remove('dragover');
});

deleteDropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    deleteDropZone.classList.remove('dragover');
    const sordToDelete = event.dataTransfer.getData('text/plain'); // get sord
     // You can directly call openDeleteModal here if you want.
     openDeleteModal(sordToDelete);

});

//initial load of data
fetchOrderData();

});