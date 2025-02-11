// customer-actions.js

let selectedCustomerId = null;
let currentLogoDataUrl = null; // You might not need this anymore, as you are uploading a file
let currentLogoFile = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('customer-actions.js loaded');

    // --- DOM elements ---
    const createNewCustomerButton = document.getElementById('create-new-customer-button');
    const createCustomerModal = document.getElementById('create-new-customer-modal');
    const closeNewCustomerModalButton = createCustomerModal.querySelector('.close-button');

    const addExistingCustomerButton = document.getElementById('add-existing-customer-button');
    const addExistingCustomerModal = document.getElementById('add-existing-customer-modal');
    const closeExistingCustomerModalButton = addExistingCustomerModal.querySelector('.close-button');

    const customerListElement = document.getElementById('customer-list');
    const allCustomerListUl = document.getElementById('all-customer-list-ul'); // Get UL for "All Customers" modal - NEW DOM ELEMENT SELECTOR
    const logoUploadInput = document.getElementById('logo-upload-input'); // Get reference to the hidden file input - IMPORTANT!
    const customerSearchInput = document.getElementById('search-input'); // Get search input in "Add Existing Customer" modal
    const clearCustomerSearchButton = document.getElementById('clear-search-button'); // Get clear search button in "Add Existing Customer" modal
    
    const allCustomersModal = document.getElementById('all-customers-modal'); // Get "All Customers" modal  <--- CHECK THIS LINE - IS IT HERE?
    const openAllCustomersModalButton = document.getElementById('open-all-customers-modal-button');
    const closeAllCustomersModalButton = allCustomersModal.querySelector('.close-button'); 

    const createCustomerForm = document.getElementById('create-customer-form');
    const newCustomerNameInput = document.getElementById('new-customer-name');
    const newContactPersonInput = document.getElementById('new-contact-person');
    const newCustomerEmailInput = document.getElementById('new-customer-email');
  
    const addThreadsCheckbox = document.getElementById('add-threads-checkbox'); // Get "Add Threads?" checkbox
    const threadInputArea = document.getElementById('thread-input-area'); // Get the thread input area div

    // --- Button Event Listeners ---
    createNewCustomerButton.addEventListener('click', () => {
        console.log('Create New Customer button clicked!');
        createCustomerModal.style.display = 'block';
    });

    addExistingCustomerButton.addEventListener('click', () => {
        console.log('Add to Existing Customer button clicked!');
        populateCustomerList();
        addExistingCustomerModal.style.display = 'block';
    });
      openAllCustomersModalButton.addEventListener('click', () => {
        console.log('"Customers" button in header clicked!'); // Debug log
        populateAllCustomersList(); // Call the new function to populate "All Customers" modal
        allCustomersModal.style.display = 'block'; // Open the "All Customers" modal
    });
      addThreadsCheckbox.addEventListener('change', () => {
        if (addThreadsCheckbox.checked) {
            console.log('"Add Threads?" checkbox CHECKED'); // Debug log - checkbox checked
            threadInputArea.style.display = 'block'; // Show thread input area
        } else {
            console.log('"Add Threads?" checkbox UNCHECKED'); // Debug log - checkbox unchecked
            threadInputArea.style.display = 'none'; // Hide thread input area
        }
    });


    // --- Modal Close Event Listeners ---
    closeNewCustomerModalButton.addEventListener('click', () => {
        createCustomerModal.style.display = 'none';
    });
    customerSearchInput.addEventListener('input', handleCustomerSearchInput); // Input event for search
    clearCustomerSearchButton.addEventListener('click', clearCustomerSearch); // Click event for clear button

    window.addEventListener('click', (event) => {
        if (event.target === createCustomerModal) {
            createCustomerModal.style.display = 'none';
        }
    });

    closeExistingCustomerModalButton.addEventListener('click', () => {
        addExistingCustomerModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === addExistingCustomerModal) {
            addExistingCustomerModal.style.display = 'none';
        }
    });
      closeAllCustomersModalButton.addEventListener('click', () => {
        allCustomersModal.style.display = 'none'; // Close the "All Customers" modal
    });

    window.addEventListener('click', (event) => {
        if (event.target === allCustomersModal) {
            allCustomersModal.style.display = 'none'; // Close modal if clicked outside
        }
    });

    // --- Form Handling ---
    createCustomerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const customerName = newCustomerNameInput.value.trim();
        const contactPerson = newContactPersonInput.value.trim();
        const email = newCustomerEmailInput.value.trim();

        if (!customerName) {
            alert("Customer name is required!");
            return;
        }

        const newCustomerData = {
            name: customerName,
            contactPerson: contactPerson,
            email: email
        };

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCustomerData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            alert(result.message);

            createCustomerForm.reset();
            createCustomerModal.style.display = 'none';

            populateCustomerList();

        } catch (error) {
            console.error('Error adding customer:', error);
            alert(`Failed to add customer: ${error.message}`);
        }
    });


    async function populateCustomerList() {
        console.log('populateCustomerList() called');
        try {
            const response = await fetch('/api/customers');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const customers = await response.json();
            console.log('Customers fetched:', customers);

            customerListElement.innerHTML = '';

            if (customers.length === 0) {
                customerListElement.innerHTML = '<li class="empty-list-item">No customers yet.</li>';
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
                    <div class="customer-actions-inline">
                        <button type="button" class="add-logo-button" data-customer-id="${customer.id}">Add Logo</button>
                        <a href="/customer_pages/${customerNameSlug}.html" target="_blank" class="view-customer-page-link">View Page</a>
                    </div>
                `;
                li.classList.add('customer-list-item');
                li.dataset.customerId = customer.id;
                customerListElement.appendChild(li);
            });

            // --- EVENT LISTENERS FOR "ADD LOGO" BUTTONS ---
            const addLogoButtons = customerListElement.querySelectorAll('.add-logo-button');
            addLogoButtons.forEach(button => {
                button.addEventListener('click', async (event) => {
                    const customerId = event.target.dataset.customerId;
                    const customerName = customers.find(c => c.id === Number(customerId))?.name;

                    if (!currentLogoDataUrl) {
                        alert("Please upload a logo first before adding to customer.");
                        return;
                    }

                    try {
                        // 1. Collect Form Data from the modal:
                        const logoNameInput = document.getElementById('logo-name');
                        const logoPositionSelect = document.getElementById('logo-position');
                        const logoTypeCheckboxes = document.querySelectorAll('input[name="logoType"]:checked'); // Get all checked checkboxes for logo type
                        const threadNumbersInput = document.getElementById('thread-numbers');

                        const logoName = logoNameInput.value.trim();
                        const logoPosition = logoPositionSelect.value;
                        const logoTypes = Array.from(logoTypeCheckboxes).map(checkbox => checkbox.value); // Extract values from checked checkboxes
                        const threadNumbers = threadNumbersInput.value.trim();


                        // 2. Update FormData to Include All Logo Details:
                        const formData = new FormData();
                        formData.append('logo-upload-input', currentLogoFile);
                        formData.append('logoName', logoName); // Add logo name
                        formData.append('logoPosition', logoPosition); // Add logo position
                        formData.append('logoType', logoTypes.join(', ')); // Join logo types array into comma-separated string
                        formData.append('threadNumbers', threadNumbers); // Add thread numbers


                        console.log("FormData contents:"); 
                        for (let pair of formData.entries()) { 
                            console.log(pair[0]+ ', ' + pair[1]);
                        }
                        console.log("Request Headers (before fetch):"); 
                        console.log(JSON.stringify({ 
                            // 'Content-Type': 'multipart/form-data' - FormData Content-Type is automatically set by browser
                        }, null, 2));

                        const response = await fetch(`/api/customers/${customerId}/logos`, {
                            method: 'PUT',
                            // headers: {'Content-Type': 'multipart/form-data'}, - REMOVE THIS LINE - FormData Content-Type is automatically set by browser
                            body: formData
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }

                        const result = await response.json();
                        alert(`Logo added to customer "${customerName}" with details!`);

                    } catch (error) {
                        console.error('Error updating customer logo with details:', JSON.stringify(error, null, 2));
                        alert(`Failed to add logo to customer: ${error.message}`);
                    }

                    addExistingCustomerModal.style.display = 'none';
                });
            });
            // --- END EVENT LISTENERS FOR "ADD LOGO" BUTTONS ---

        } catch (error) {
            console.error('Could not fetch customers:', error);
            customerListElement.innerHTML = '<li class="error-list-item">Error loading customers.</li>';
        }
    }
  
  
  
  
  
  function handleCustomerSearchInput() {
    const searchTerm = customerSearchInput.value.toLowerCase(); // 1 - Get search term
    console.log('Customer search input changed:', searchTerm); // debug log
    filterCustomerList(searchTerm); // 2 - Call filter function
    updateClearSearchButtonVisibility(); // 3 - Update clear button visibility
}

function clearCustomerSearch() {
    customerSearchInput.value = ''; // 1 - Clear search input
    console.log('Customer search input cleared'); // debug log
    filterCustomerList(''); // 2 - Filter with empty search term (show all)
    updateClearSearchButtonVisibility(); // 3 - Update clear button visibility
}

function filterCustomerList(searchTerm) {
    const customerListItems = document.querySelectorAll('#customer-list li'); // 1 - Get all customer list items

    customerListItems.forEach(item => { // 2 - Loop through list items
        const customerName = item.querySelector('.customer-name-text').textContent.toLowerCase(); // 3 - Get customer name from each item

        if (customerName.includes(searchTerm)) { // 4 - Check if name includes search term
            item.style.display = ''; // 5 - Show item if it matches
        } else {
            item.style.display = 'none'; // 6 - Hide item if it doesn't match
        }
    });
}

function updateClearSearchButtonVisibility() {
    if (customerSearchInput.value.length > 0) { // 1 - Check if search input has text
        clearCustomerSearchButton.style.display = 'flex'; // 2 - Show clear button if input has text
    } else {
        clearCustomerSearchButton.style.display = 'none'; // 3 - Hide clear button if input is empty
    }
}
  
  
  // ... your existing functions ...

// --- NEW FUNCTION - populateAllCustomersList() for "All Customers" Modal --- (ADD THIS WHOLE FUNCTION BLOCK AFTER populateCustomerList)

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
  

// --- END populateAllCustomersList() function ---
  
  

  
});
