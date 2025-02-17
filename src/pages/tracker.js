// tracker.js

document.addEventListener('DOMContentLoaded', () => {
    const csvUploadInput = document.getElementById('csv-upload-input');
    const jobSearchInput = document.getElementById('job-search-input');
    const jobTableBody = document.querySelector('#job-tracker-table tbody');

    let jobData = []; // Array to store job data (initially empty)
    let filteredJobs = []; // Array for filtered jobs

    // --- Event listener for CSV upload ---
    csvUploadInput.addEventListener('change', handleFileUpload);

    // --- Event listener for search input ---
    jobSearchInput.addEventListener('input', handleSearchInput);

    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            alert('Please select a CSV file.');
            return;
        }

        const text = await file.text(); // Read file content as text
        jobData = await parseCSVData(text); // Parse CSV data
        applyFilters(); // Apply initial filters and display data
    }


    async function parseCSVData(csvText) {
        const rows = csvText.split('\n').map(row => row.trim()); // Split into rows
        const headers = rows.shift()?.split(',') || []; // Get headers, remove first row if empty
        const data = [];

        for (const row of rows) {
            const values = row.split(',');
            if (values.length === headers.length) {
                const jobEntry = {};
                for (let i = 0; i < headers.length; i++) {
                    jobEntry[headers[i]] = values[i].trim(); // Map values to headers
                }
                data.push(jobEntry);
            }
        }
        return data;
    }


    function displayJobs() {
        jobTableBody.innerHTML = ''; // Clear table

        if (!filteredJobs.length) {
            jobTableBody.innerHTML = `<tr><td colspan="3">No jobs found.</td></tr>`;
            return;
        }

        filteredJobs.forEach(job => {
            const row = jobTableBody.insertRow();
            row.insertCell().textContent = job["Job ID"] || 'N/A'; // Example: Adjust based on your CSV headers
            row.insertCell().textContent = job["Customer"] || 'N/A'; // Example: Adjust based on your CSV headers
            row.insertCell().textContent = job["Status"] || 'N/A';   // Example: Adjust based on your CSV headers
            // Add more cells for other job data fields as needed, using your CSV headers
        });
    }

    function handleSearchInput() {
        const searchTerm = jobSearchInput.value.toLowerCase();
        applyFilters(searchTerm); // Apply search filter
    }

    function applyFilters(searchTerm = '') {
        filteredJobs = jobData.filter(job => {
            const searchString = `${job["Job ID"]} ${job["Customer"]} ${job["Status"]}`.toLowerCase(); // Adjust search fields
            return searchString.includes(searchTerm);
        });
        displayJobs(); // Update displayed table
    }


    // Initial display (no data yet)
    displayJobs([]);

});