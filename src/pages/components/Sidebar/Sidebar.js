// src/pages/components/Sidebar/Sidebar.js
//import React from 'react'; // No need to import React here anymore with CDN

//import styles from './Sidebar.module.css'; // If you create Sidebar.module.css

// --- Sidebar Component (React) ---
function Sidebar({ onFileUpload }) { // onFileUpload prop to pass CSV data handling up
    const [isDragOver, setIsDragOver] = React.useState(false);

    const handleDragOver = (evt) => {
        evt.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (evt) => {
        evt.preventDefault();
        setIsDragOver(false);
    };


    const handleFileDrop = (evt) => {
        evt.preventDefault();
        setIsDragOver(false);
        const files = evt.dataTransfer.files;
        handleFiles(files);
    };

    const handleFileInputChange = (evt) => {
        const files = evt.target.files;
        handleFiles(files);
    };

    const handleFiles = async (files) => {
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                const reader = new FileReader();

                reader.onload = async function(event) { // Make onload async
                    const csvText = event.target.result;
                    await parseCSVData(csvText); // Await parseCSVData
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
    };

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
            alert('CSV file processed and data received from server! Table will now update.');
            onFileUpload(data); // Call the callback to update orders in App component

        } catch (error) {
            console.error('Error sending CSV data to server:', error);
            alert('Error processing CSV file.');
        }
    }


    return (
        React.createElement('aside', { className: "sidebar", id: "sidebar" },
            React.createElement('div', { className: "sidebar-header" },
                React.createElement('h2', null, 'Upload & Actions'),
                React.createElement('button', { id: "toggle-sidebar", className: "toggle-sidebar-button" },
                    React.createElement('i', { className: "fas fa-chevron-left" })
                )
            ),
            React.createElement('div', {
                    id: "dropArea",
                    className: `drop-area ${isDragOver ? 'dragover' : ''}`,
                    onDragOver: handleDragOver,
                    onDrop: handleFileDrop,
                    onDragLeave: handleDragLeave // Add dragLeave handler
                },
                React.createElement('p', null, 'Drag & Drop CSV File Here'),
                React.createElement('p', null, 'or'),
                React.createElement('button', { id: "fileButton", className: "primary-btn", onClick: () => document.getElementById('fileInput').click() }, 'Choose File'),
                React.createElement('input', { type: 'file', id: 'fileInput', accept: ".csv", style: { display: 'none' }, onChange: handleFileInputChange })
            ),
            React.createElement('div', { id: "delete-area", className: "delete-area" , style: {display: isDragOver ? 'block' : 'none'} }, // Conditionally show delete area
                React.createElement('i', { className: "fas fa-trash-alt" }),
                ' Drag orders here to DELETE'
            )
        )
    );
}

export default Sidebar; // Export the component