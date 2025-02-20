--- modified SummaryCards.js ---
// src/pages/components/SummaryCards/SummaryCards.js
import styles from './SummaryCards.module.css'; // Import CSS Module
import React from 'react';

// --- SummaryCards Component (React) ---
function SummaryCards({ orders, onFileUpload, isDragOver, setIsDragOver }) { // ADD PROPS HERE
    const totalJobs = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + (parseInt(order['Total Items'], 10) || 0), 0);
    const totalLogos = orders.reduce((total, order) => total + (parseInt(order['Total Logos'], 10) || 0), 0);


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
                    await parseCSVData(csvText, onFileUpload); // Await parseCSVData & pass callback
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

    async function parseCSVData(csvText, onFileUpload) { // ADD onFileUpload CALLBACK
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
        React.createElement('div', { className: "summary-cards-container" }, // Changed className to "summary-cards-container"
            React.createElement('div', { className: "card" },
                React.createElement('h3', null, 'Total Jobs'),
                React.createElement('p', null, totalJobs)
            ),
            React.createElement('div', { className: "card" },
                React.createElement('h3', null, 'Total Items'),
                React.createElement('p', null, totalItems)
            ),
            React.createElement('div', { className: "card" },
                React.createElement('h3', null, 'Total Logos'),
                React.createElement('p', null, totalLogos)
            ),
            React.createElement('div', { className: "card", id: "upload-card-container" }, // ADD UPLOAD CARD HERE
                React.createElement('div', {
                    id: "dropArea",
                    className: `drop-area ${isDragOver ? 'dragover' : ''}`,
                    onDragOver: handleDragOver,
                    onDrop: handleFileDrop,
                    onDragLeave: handleDragLeave
                },
                    React.createElement('p', null, 'Drag & Drop CSV File Here'),
                    React.createElement('p', null, 'or'),
                    React.createElement('button', { id: "fileButton", className: "primaryBtn", onClick: () => document.getElementById('fileInput').click() }, 'Choose File'),
                    React.createElement('input', { type: 'file', id: 'fileInput', accept: ".csv", style: { display: 'none' }, onChange: handleFileInputChange })
                )
            )
        )
    );
}

export default SummaryCards;