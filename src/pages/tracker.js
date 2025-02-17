// src/pages/tracker.js

document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileButton = document.getElementById('fileButton');

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
                // We'll add the CSV processing logic here next!
                alert('CSV file uploaded! (Processing logic not yet implemented)'); // Placeholder message
            } else {
                alert('Invalid file type. Please upload a CSV file.');
            }
        }
    }
});