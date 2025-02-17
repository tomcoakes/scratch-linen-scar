// src/pages/tracker.js

document.addEventListener("DOMContentLoaded", () => {
  const dropArea = document.getElementById("dropArea");
  const fileInput = document.getElementById("fileInput");
  const fileButton = document.getElementById("fileButton");

  fileButton.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", handleFile);
  dropArea.addEventListener("dragover", handleDragOver);
  dropArea.addEventListener("drop", handleFileDrop);
  
  fetchOrderData(); // Call fetchOrderData to initially load and display orders

  function handleDragOver(evt) {
    evt.preventDefault();
    dropArea.classList.add("dragover");
  }

  function handleFileDrop(evt) {
    evt.preventDefault();
    dropArea.classList.remove("dragover");
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
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        const reader = new FileReader();

        reader.onload = function (event) {
          const csvText = event.target.result;
          parseCSVData(csvText); // Call a new function to parse the CSV data
        };

        reader.onerror = function (error) {
          console.error("Error reading CSV file:", error);
          alert("Error reading CSV file.");
        };

        reader.readAsText(file);
      } else {
        alert("Invalid file type. Please upload a CSV file.");
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

          const data = await response.json(); // Expecting JSON back from the server
          console.log('Parsed CSV data received from server:', data); // Log received data
          alert('CSV file processed and data received from server! Check console.'); // Alert
        
          fetchOrderData();

          // Next steps: Display the order data in the table! 

      } catch (error) {
          console.error('Error sending CSV data to server:', error);
          alert('Error processing CSV file.');
      }
  }
  
  
  async function fetchOrderData() {
    try {
        const response = await fetch('/api/active-orders'); // NEW API ENDPOINT URL
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Order data fetched:', data); // Log the fetched data (for debugging)
        displayOrderData(data); // Call function to display data in the table

    } catch (error) {
        console.error('Error fetching order data:', error);
        alert('Failed to load order data.');
    }
}
  
  
function displayOrderData(orders) {
    const tableBody = document.querySelector('#orders-table tbody');
    tableBody.innerHTML = ''; // Clear existing table rows

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="27" style="text-align:center;">No active orders found.</td></tr>`; // adjust colspan to match your table headers
        return;
    }

    orders.forEach(order => {
        const row = tableBody.insertRow();
        let cellIndex = 0;

        // Helper function to add a cell with text content
        const addCell = (textContent) => {
            const cell = row.insertCell(cellIndex++);
            cell.textContent = textContent || '';
        };

        addCell(order.SORD);             // Use "SORD" (uppercase, as we renamed it in server.js)
        addCell(order["Trader Code"]);    // Use "Trader Code" (with space)
        addCell(order["Trader Name"]);   // Use "Trader Name" (with space)
        addCell(order["Total Items"]);    // Use "Total Items"  (with space)
        addCell(order["Ordered Date"]);   // Use "Ordered Date" (with space)
        addCell(order["Due Date"]);       // Use "Due Date"     (with space)
        addCell(order["Total Logos"]);    // Use "Total Logos"  (with space)
        // ... (add cells for the rest of your Tracker sheet headers, using the EXACT keys from your consolidated JSON data) ...
        // ... Make sure the keys in addCell() match the keys in your consolidated JSON ...
    });
}
});
