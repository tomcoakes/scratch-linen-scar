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
        const row = tableBody.insertRow(); // Create a new table row (<tr>)

        // --- ADD TABLE CELLS (<td>) FOR EACH HEADER ---
        let cellIndex = 0; // Keep track of cell index

        // Helper function to add a cell with text content
        const addCell = (textContent) => {
            const cell = row.insertCell(cellIndex++); // insertCell() increments cellIndex
            cell.textContent = textContent || ''; // Use textContent and handle null/undefined
        };

        addCell(order.OUR_REFERENCE);
        addCell(order["A/C"]); // Access using bracket notation for headers with spaces/special chars
        addCell(order["Trader Name"]);
        addCell(order["Product Code"]);
        addCell(order["Product Description"]);
        addCell(order["Product Pack Size"]);
        addCell(order["Ordered Qty"]);
        addCell(order["Outstanding Qty"]);
        addCell(order["Total Price"]);
        addCell(order["Total Cost"]);
        addCell(order["Order Date"]);
        addCell(order["Item Due Date"]);
        addCell(order["SWP CODE"]);
        // ... add cells for all your "Tracker" sheet headers in order, using addCell() ... 
        // ... (add cells for all 27 headers from your Tracker sheet) ...  For now, let's just do the first 13 or so to get started, you can add the rest later!
    });
}
});
