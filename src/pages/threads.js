// threads.js

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const tableBody = document.querySelector('#threads-table tbody');
  const editModal = document.getElementById('edit-modal');
  const addModal = document.getElementById('add-modal');
  const closeButtons = document.querySelectorAll('.close-button');
  const editForm = document.getElementById('edit-form');
  const addForm = document.getElementById('add-form');
  const searchInput = document.getElementById('search-input');
  const clearSearchButton = document.getElementById('clear-search-button');
  const addThreadButton = document.getElementById('add-thread-button');
  const filterType = document.getElementById('filter-type'); // REMOVE THIS LINE
  
  
  const allCustomersModal = document.getElementById('all-customers-modal'); // Get "All Customers" modal  <--- CHECK THIS LINE - IS IT HERE?
  const openAllCustomersModalButton = document.getElementById('open-all-customers-modal-button');
  const closeAllCustomersModalButton = allCustomersModal.querySelector('.close-button'); 
  
  const customerListElement = document.getElementById('customer-list');
  const allCustomerListUl = document.getElementById('all-customer-list-ul'); // Get UL for "All Customers" modal - NEW DOM ELEMENT SELECTOR
  const logoUploadInput = document.getElementById('logo-upload-input'); // Get reference to the hidden file input - IMPORTANT!
  const customerSearchInput = document.getElementById('search-input'); // Get search input in "Add Existing Customer" modal
  const clearCustomerSearchButton = document.getElementById('clear-search-button'); // Get clear search button in "Add Existing Customer" modal
  
        openAllCustomersModalButton.addEventListener('click', () => {
        console.log('"Customers" button in header clicked!'); // Debug log
        populateAllCustomersList(); // Call the new function to populate "All Customers" modal
        allCustomersModal.style.display = 'block'; // Open the "All Customers" modal
    });
  
        closeAllCustomersModalButton.addEventListener('click', () => {
        allCustomersModal.style.display = 'none'; // Close the "All Customers" modal
    });

  // Data Variables
  let threadsData = [];
  let filteredThreads = [];
  let currentSort = { key: '', order: 'asc' }; // Tracks current sort state
  const imageCache = {}; // Caches image URLs to prevent redundant requests

  // Image Prefixes
  const imagePrefixes = ['911', '919', '915', 'N', '933', ''];

  // Fetch Threads Data from Server
  const fetchThreads = async () => {
    console.log('Fetching threads data...');
    try {
      const response = await fetch('/api/threads');
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      threadsData = await response.json();
      console.log('Threads data fetched successfully:', threadsData);
      applyFilters(); // Apply any active filters
    } catch (error) {
      console.error('Error fetching threads:', error);
      displayError(`Failed to load thread data: ${error.message}`);
    }
  };

  // Display Error Messages
  const displayError = (message) => {
    const existingError = document.querySelector('.error-message');
    if (existingError) return; // Prevent multiple error messages

    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `<p>${message}</p>`;
    document.body.prepend(errorContainer);

    // Styling for the error message
    Object.assign(errorContainer.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#e74c3c',
      color: '#ffffff',
      padding: '10px 20px',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: '3000',
      fontWeight: 'bold',
    });

    // Automatically remove the error message after 5 seconds
    setTimeout(() => {
      errorContainer.remove();
    }, 5000);
  };

  // Display Threads in the Table
 const displayThreads = () => {
    console.log('Displaying threads...');
    tableBody.innerHTML = ''; // Clear existing rows

    if (filteredThreads.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" style="text-align: center;">No threads found.</td>`;
      tableBody.appendChild(tr);
      console.log('No threads match the current filters.');
      return;
    }

    filteredThreads.forEach(thread => {
      const tr = document.createElement('tr');
         const imageContent = thread.Hex
              ? `<div class="thread-image" style="background-color: ${thread.Hex};"></div>`
              : `<img src="" alt="Thread Image" class="thread-image" data-thread-id="${thread.id}" loading="lazy">`;

        tr.innerHTML = `
            <td>
                ${imageContent}
            </td>
          <td>${thread["Thread Number"]}</td>
        <td>${thread["Type"]}</td>
        <td>${thread["Thread No (thickness)"] || 'N/A'}</td>
        <td>${thread["Length (m)"] || 'N/A'}</td>
        <td>${thread["Colours"]["Colour"] || 'N/A'}</td>
        <td>${thread["Colours"]["Stock Quantity"] || 'N/A'}</td>
        <td>${formatCompanyNames(thread["Colours"]["Logo Name used in"])}</td>
        <td>
          <button class="edit-button" data-thread-id="${thread.id}">Edit</button>
          <button class="delete-button" data-thread-id="${thread.id}">Delete</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

     // Attach Event Listeners to Edit and Delete Buttons
    attachActionButtonsListeners();

    // Load Images for Each Thread - call after rows have been rendered
      loadImagesForThreads();
  };

  // Format Company Names into Badges
  const formatCompanyNames = (companyString) => {
    if (!companyString) return 'N/A';
    const companies = companyString.split(',').map(company => company.trim()).filter(company => company !== '');
    if (companies.length === 0) return 'N/A';
    return companies.map(company => `<span class="badge">${company}</span>`).join(' ');
  };

 // Load Images for Each Thread
  const loadImagesForThreads = () => {
      console.log('Loading images for threads...');
    document.querySelectorAll('.thread-image').forEach(container => {
         //Only load images if there isn't a hex value for the thread
        const threadId = Number(container.getAttribute('data-thread-id'));
        const thread = threadsData.find(t => t.id === threadId);
       if (thread && !thread.Hex ) {
          loadThreadImage(thread["Thread Number"], thread["Thread No (thickness)"], container);
       } else if(!thread) {
         console.warn(`Thread with ID ${threadId} not found.`);
        }
    });
  };

  // Load a Single Thread Image with Prefixes
  const loadThreadImage = (threadNumber, threadThickness, imgElement) => {
    const uniqueKey = `${threadNumber}-${threadThickness}`;
    if (imageCache[uniqueKey]) {
      console.log(`Loading cached image for Thread: ${uniqueKey}`);
      imgElement.src = imageCache[uniqueKey];
      return;
    }

    const tryNextPrefix = (index) => {
      if (index >= imagePrefixes.length) {
        console.warn(`No image found for Thread: ${uniqueKey}`);
        imgElement.src = ''; // Trigger placeholder styles
         imgElement.classList.add('placeholder');
          imgElement.alt = 'No Image Available';
        return;
      }

      const prefix = imagePrefixes[index];
      const imageNumber = prefix + threadNumber;
      const imageUrl = `https://shop.madeira.co.uk/data/media/images/products/${imageNumber}.jpg`;

      console.log(`Attempting to load image: ${imageUrl} for Thread: ${uniqueKey}`);

      // Attempt to load the image
      const testImage = new Image();
      testImage.src = imageUrl;
      testImage.onload = () => {
          console.log(`Image loaded successfully: ${imageUrl} for Thread: ${uniqueKey}`);
          imgElement.src = imageUrl;
          imageCache[uniqueKey] = imageUrl; // Cache the successful URL
         imgElement.classList.remove('placeholder');
      };
      testImage.onerror = () => {
        console.warn(`Failed to load image: ${imageUrl} for Thread: ${uniqueKey}. Trying next prefix...`);
        tryNextPrefix(index + 1);
      };
    };

    tryNextPrefix(0); // Start with the first prefix
  };

  // Attach Event Listeners to Edit and Delete Buttons
  const attachActionButtonsListeners = () => {
    console.log('Attaching event listeners to action buttons...');
    document.querySelectorAll('.edit-button').forEach(button => {
      button.addEventListener('click', openEditModal);
    });

    document.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', deleteThread);
    });
  };

  // Open Edit Modal and Populate Form
  const openEditModal = (e) => {
    const threadId = Number(e.target.getAttribute('data-thread-id'));
    console.log(`Opening edit modal for Thread ID: ${threadId}`);

    const thread = threadsData.find(t => t.id === threadId);
    if (thread) {
      editForm['edit-id'].value = thread.id;
      editForm['threadNumber'].value = thread["Thread Number"];
      editForm['threadThickness'].value = thread["Thread No (thickness)"];
      editForm['type'].value = thread["Type"];
      editForm['length'].value = thread["Length (m)"];
      editForm['colour'].value = thread["Colours"]["Colour"];
      editForm['stockQuantity'].value = thread["Colours"]["Stock Quantity"];
      editForm['logoName'].value = thread["Colours"]["Logo Name used in"] || '';

      editModal.style.display = 'block';
    } else {
      console.error(`Thread with ID ${threadId} not found.`);
      displayError('Selected thread not found.');
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    console.log('Opening add modal...');
    addForm.reset();
    addModal.style.display = 'block';
  };

  // Close All Modals
  const closeModals = () => {
    console.log('Closing modals...');
    editModal.style.display = 'none';
    addModal.style.display = 'none';
  };

  // Delete a Thread
  const deleteThread = async (e) => {
    const threadId = Number(e.target.getAttribute('data-thread-id'));
    console.log(`Attempting to delete Thread ID: ${threadId}`);

    const confirmDelete = confirm(`Are you sure you want to delete this thread?`);
    if (!confirmDelete) {
      console.log('Deletion cancelled by user.');
      return;
    }

    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      console.log(`Delete response for Thread ID ${threadId}:`, result);

      if (response.ok) {
        // Remove thread from local data
        threadsData = threadsData.filter(t => t.id !== threadId);
        applyFilters(); // Reapply filters and sorting
        alert(result.message);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`Error deleting Thread ID ${threadId}:`, error);
      displayError(`Failed to delete thread: ${error.message}`);
    }
  };

  // Handle Edit Form Submission
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Retrieve and validate required fields
    const threadNumber = editForm['threadNumber'].value.trim();
    const colour = editForm['colour'].value.trim();

    if (!threadNumber || !colour) {
      displayError("Thread Number and Colour are required.");
      return;
    }

    const updatedThread = {
      id: Number(editForm['edit-id'].value), // Ensure id is a number
      "Thread Number": threadNumber,
      "Thread No (thickness)": editForm['threadThickness'].value.trim(),
      "Type": editForm['type'].value.trim(),
      "Length (m)": editForm['length'].value.trim(),
      "Colours": {
        "Colour": colour,
        "Stock Quantity": editForm['stockQuantity'].value.trim(),
        "Quantity Needed": "",
        "PreOrder Quanity": "",
        "Logo Name used in": formatLogoInput(editForm['logoName'].value.trim())
      }
    };

    console.log('Submitting updated thread:', updatedThread);

    try {
      const response = await fetch(`/api/threads/${updatedThread.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedThread)
      });

      const result = await response.json();
      console.log(`Update response for Thread ID ${updatedThread.id}:`, result);

      if (response.ok) {
        // Update local data
        const index = threadsData.findIndex(t => t.id === updatedThread.id);
        if (index !== -1) {
          threadsData[index] = updatedThread;
          console.log(`Local data updated for Thread ID ${updatedThread.id}:`, threadsData[index]);
           const uniqueKey = `${updatedThread["Thread Number"]}-${updatedThread["Thread No (thickness)"]}`;
          delete imageCache[uniqueKey];
          applyFilters(); // Reapply filters and sorting

        }
        alert(result.message);
        closeModals();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`Error updating Thread ID ${updatedThread.id}:`, error);
      displayError(`Failed to update thread: ${error.message}`);
    }
  });

  // Handle Add Form Submission
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const threadNumber = addForm['newThreadNumber'].value.trim();
    const colour = addForm['newColour'].value.trim();

    if (!threadNumber || !colour) {
      displayError("Thread Number and Colour are required.");
      return;
    }

    const newThread = {
      // The backend assigns a unique numeric ID
      "Thread Number": threadNumber,
      "Thread No (thickness)": addForm['newThreadThickness'].value.trim(),
      "Type": addForm['newType'].value.trim(),
      "Length (m)": addForm['newLength'].value.trim(),
      "Colours": {
        "Colour": colour,
        "Stock Quantity": addForm['newStockQuantity'].value.trim(),
        "Quantity Needed": "",
        "PreOrder Quanity": "",
        "Logo Name used in": formatLogoInput(addForm['newLogoName'].value.trim())
      }
    };

    console.log('Submitting new thread:', newThread);

    try {
      const response = await fetch(`/api/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newThread)
      });

      const result = await response.json();
      console.log('Add thread response:', result);

      if (response.ok) {
        alert(result.message);
        fetchThreads(); // Refresh data
        closeModals();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding new thread:', error);
      displayError(`Failed to add thread: ${error.message}`);
    }
  });

  // Format Logo/Company Input
  const formatLogoInput = (input) => {
    if (!input) return '';
    return input.split(',').map(logo => logo.trim()).filter(logo => logo !== '').join(', ');
  };

  // Close Modals When Clicking Close Buttons
  closeButtons.forEach(button => {
    button.addEventListener('click', closeModals);
  });

  // Close Modals When Clicking Outside Modal Content
  window.addEventListener('click', (event) => {
    if (event.target === editModal || event.target === addModal) {
      closeModals();
    }
  });

    // Apply Filters and Sorting
   const applyFilters = () => {
    console.log('Applying filters and sorting...');
        const searchTerm = searchInput.value.toLowerCase();

    filteredThreads = threadsData.filter(thread => {
      const threadNumberMatch = thread["Thread Number"].toLowerCase().includes(searchTerm);
      const typeMatch = thread["Type"].toLowerCase().includes(searchTerm);
      const colourMatch = thread["Colours"]["Colour"].toLowerCase().includes(searchTerm) ||
                           (thread["Colours"]["Colour Subsets"] && thread["Colours"]["Colour Subsets"].toLowerCase().includes(searchTerm));
      const companyMatch = thread["Colours"]["Logo Name used in"]
        ? thread["Colours"]["Logo Name used in"].toLowerCase().includes(searchTerm)
        : false;

          const matchesSearch = threadNumberMatch || typeMatch || colourMatch || companyMatch;
          return matchesSearch;
        });

        sortThreads(); // Apply current sorting to the filtered data
        displayThreads();
        updateSortIndicators();
    };

  // Event Listeners for Search and Filter
  searchInput.addEventListener('input', () => {
    console.log('Search input changed:', searchInput.value);
    applyFilters();
    if (searchInput.value.length > 0) {
      clearSearchButton.style.display = 'flex'; // Show button if input has text
    } else {
      clearSearchButton.style.display = 'none'; // Hide if input is empty
    }
  });


  clearSearchButton.addEventListener('click', () => {
    searchInput.value = ''; // Clear the input field
    clearSearchButton.style.display = 'none'; // Hide the clear button
    applyFilters(); // Re-apply filters to show all threads or default view
  });

  // Sorting Functionality
  const sortThreads = () => {
    if (!currentSort.key) {
      console.log('No sorting applied.');
      return; // No sorting to apply
    }

    console.log(`Sorting threads by ${currentSort.key} in ${currentSort.order} order.`);

    filteredThreads.sort((a, b) => {
      let aValue, bValue;

      switch (currentSort.key) {
        case 'threadNumber':
          aValue = a["Thread Number"];
          bValue = b["Thread Number"];
          break;
        case 'type':
          aValue = a["Type"];
          bValue = b["Type"];
          break;
        case 'threadThickness':
          aValue = a["Thread No (thickness)"] || '';
          bValue = b["Thread No (thickness)"] || '';
          break;
        case 'length':
          aValue = a["Length (m)"] || '';
          bValue = b["Length (m)"] || '';
          break;
        case 'colour':
          aValue = a["Colours"]["Colour"] || '';
          bValue = b["Colours"]["Colour"] || '';
          break;
        case 'stockQuantity':
          aValue = parseInt(a["Colours"]["Stock Quantity"], 10) || 0;
          bValue = parseInt(b["Colours"]["Stock Quantity"], 10) || 0;
          break;
        default:
          console.warn(`Unknown sort key: ${currentSort.key}`);
          return 0;
      }

      // Determine if the values are numbers or strings
      const isNumeric = typeof aValue === 'number' && typeof bValue === 'number';

      if (isNumeric) {
        return currentSort.order === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        // Compare as strings
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
        if (aValue < bValue) return currentSort.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
      }
    });

    console.log('Sorting completed. First thread:', filteredThreads[0]);
  };

  // Attach Sorting Event Listeners to Table Headers
  const attachSortingListeners = () => {
    console.log('Attaching sorting listeners to table headers...');
    const sortableHeaders = document.querySelectorAll('th.sortable');

    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const sortKey = header.getAttribute('data-sort');
        console.log(`Header clicked for sorting: ${sortKey}`);

        if (currentSort.key === sortKey) {
          // Toggle sort order
          currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
          console.log(`Toggled sort order to: ${currentSort.order}`);
        } else {
          // Set new sort key and default to ascending
          currentSort.key = sortKey;
          currentSort.order = 'asc';
          console.log(`Set new sort key to: ${currentSort.key}, order: ${currentSort.order}`);
        }

        sortThreads();
        displayThreads();
        updateSortIndicators();
      });
    });
  };

  // Update Sort Indicators in Table Headers
  const updateSortIndicators = () => {
    console.log('Updating sort indicators...');
    const headers = document.querySelectorAll('th.sortable');

    headers.forEach(header => {
      const sortKey = header.getAttribute('data-sort');
      const indicator = header.querySelector('.sort-indicator'); // THIS LINE IS NO LONGER NEEDED

      if (sortKey === currentSort.key) {
        // Update indicator based on sort order
        // indicator.innerHTML = currentSort.order === 'asc' ? '▲' : '▼'; // COMMENT OUT OR REMOVE THIS LINE
        header.classList.add(currentSort.order === 'asc' ? 'sorted-asc' : 'sorted-desc');
        header.classList.remove(currentSort.order === 'asc' ? 'sorted-desc' : 'sorted-asc');
      } else {
        // Reset indicator to default
        // indicator.innerHTML = '▲▼'; // COMMENT OUT OR REMOVE THIS LINE
        header.classList.remove('sorted-asc', 'sorted-desc');
      }
    });

    console.log('Sort indicators updated.');
  };

    // Initialize Sorting Listeners
    const initializeSorting = () => {
        console.log('Initializing sorting...');
        attachSortingListeners();
        updateSortIndicators();
    };

  // Initialize the Application
  const initializeApp = () => {
    console.log('Initializing Thread Stock Manager...');
    fetchThreads();
    initializeSorting();
    // ADDED: attach listener to open add modal
    addThreadButton.addEventListener('click', openAddModal);
     // Initially hide clear button
    clearSearchButton.style.display = 'none';
  };
  
  async function populateAllCustomersList() {
    console.log('populateAllCustomersList() called'); 
    try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const customers = await response.json();
        console.log('Customers fetched for All Customers Modal:', customers); 

        const allCustomerListUl = document.getElementById('all-customer-list-ul'); 
        allCustomerListUl.innerHTML = ''; 

        if (customers.length === 0) {
            allCustomerListUl.innerHTML = '<li class="empty-list-item">No customers yet.</li>';
            return;
        }

        customers.forEach(customer => {
            const li = document.createElement('li');
            const customerNameSlug = customer.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            li.innerHTML = `
                <span class="customer-name-text">${customer.name}</span> 
                <a href="/customer_pages/${customerNameSlug}.html" target="_blank" class="view-customer-page-link">View Page</a>
            `; 
            li.classList.add('customer-list-item');
            li.dataset.customerId = customer.id;
            allCustomerListUl.appendChild(li);
        });

        // --- SEARCH FUNCTIONALITY FOR ALL CUSTOMERS MODAL --- (NEW CODE BLOCK)
        const customerSearchInput = document.getElementById('search-customers-input'); // Get search input for ALL CUSTOMERS MODAL
        const clearSearchButton = document.getElementById('clear-customers-search-button'); // Get clear button for ALL CUSTOMERS MODAL

        customerSearchInput.addEventListener('input', handleAllCustomersSearchInput); // ADD EVENT LISTENERS FOR ALL CUSTOMERS MODAL SEARCH
        clearSearchButton.addEventListener('click', clearAllCustomersSearch);

        function handleAllCustomersSearchInput() { // NEW handleAllCustomersSearchInput FUNCTION
            const searchTerm = customerSearchInput.value.toLowerCase();
            console.log('All Customers Modal search input changed:', searchTerm);
            filterAllCustomersList(searchTerm); // Call filter function for ALL CUSTOMERS MODAL
            updateAllCustomersClearSearchButtonVisibility();
        }

        function clearAllCustomersSearch() { // NEW clearAllCustomersSearch FUNCTION
            customerSearchInput.value = '';
            console.log('All Customers Modal search input cleared');
            filterAllCustomersList(''); // Filter with empty search term (show all)
            updateAllCustomersClearSearchButtonVisibility();
        }

        function updateAllCustomersClearSearchButtonVisibility() { // NEW updateAllCustomersClearSearchButtonVisibility FUNCTION
            if (customerSearchInput.value.length > 0) {
                clearSearchButton.style.display = 'flex';
            } else {
                clearSearchButton.style.display = 'none';
            }
        }

        function filterAllCustomersList(searchTerm) { // NEW filterAllCustomersList FUNCTION
            const customerListItems = document.querySelectorAll('#all-customer-list-ul li'); // Target list in ALL CUSTOMERS MODAL

            customerListItems.forEach(item => {
                const customerName = item.querySelector('.customer-name-text').textContent.toLowerCase();

                if (customerName.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }
        // --- END SEARCH FUNCTIONALITY FOR ALL CUSTOMERS MODAL ---


    } catch (error) {
        console.error('Could not fetch customers for All Customers Modal:', error);
        allCustomerListUl.innerHTML = '<li class="error-list-item">Error loading customers.</li>';
    }
}

  // Start the Application
  initializeApp();
});