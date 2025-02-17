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
});
