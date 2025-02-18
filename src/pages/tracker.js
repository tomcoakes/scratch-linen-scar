// src/pages/tracker.js
// import React from 'react';
// import ReactDOM from 'react-dom/client';

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


// --- SearchBar Component (React) ---
function SearchBar({ searchTerm, onSearchChange, onClearSearch }) {
    const handleInputChange = (event) => {
        onSearchChange(event.target.value);
    };

    const handleClearClick = () => {
        onClearSearch(''); // Clear search term in parent component
    };

    return (
        React.createElement('div', { className: "table-controls" },
            React.createElement('div', { className: "search-input-container" },
                React.createElement('input', {
                    type: "text",
                    id: "search-input",
                    placeholder: "Search Orders...",
                    value: searchTerm,
                    onChange: handleInputChange
                }),
                React.createElement('button', {
                    type: "button",
                    id: "clear-search-button",
                    className: "clear-search-button",
                    style: { display: searchTerm ? 'inline-block' : 'none' },
                    onClick: handleClearClick
                }, '×')
            )
        )
    );
}


// --- OrderTable Component (UPDATED to fetch data and filter) ---
function OrderTable({ orders, searchTerm }) { // Receive orders and searchTerm as props

    const filteredOrders = React.useMemo(() => { // Use useMemo for filtering
        if (!searchTerm) {
            return orders; // No search term, return all orders
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        return orders.filter(order => {
            return Object.values(order).some(value => { // Search in all order values
                if (value === null || value === undefined) return false; // Skip null or undefined values
                return String(value).toLowerCase().includes(lowerSearchTerm); // Convert to string and check
            });
        });
    }, [orders, searchTerm]); // Re-filter when orders or searchTerm change


    return (
        React.createElement('div', { className: "table-container", id: "order-table-container" },
            React.createElement('h2', null, 'Active Orders (React Component!)'),
            React.createElement('table', { id: 'orders-table' },
                React.createElement('thead', null,
                    React.createElement('tr', null,
                        React.createElement('th', null, 'SORD'),
                        React.createElement('th', null, 'Trader Name'),
                        React.createElement('th', null, 'Total Items'),
                        React.createElement('th', null, 'Ordered Date'),
                        React.createElement('th', null, 'Due Date'),
                        React.createElement('th', null, 'Total Logos')
                        // ... (ADD MORE TABLE HEADERS HERE LATER) ...
                    )
                ),
                React.createElement('tbody', null,
                    filteredOrders.length > 0 ? ( // Conditionally render rows based on filteredOrders
                        filteredOrders.map(order => (
                            React.createElement('tr', { key: order.SORD },
                                React.createElement('td', null, order.SORD),
                                React.createElement('td', null, order["Trader Name"]),
                                React.createElement('td', null, order["Total Items"]),
                                React.createElement('td', null, order["Ordered Date"]),
                                React.createElement('td', null, order["Due Date"]),
                                React.createElement('td', null, order["Total Logos"])
                                // ... (ADD MORE TABLE CELLS HERE LATER) ...
                            )
                        ))
                    ) : (
                        React.createElement('tr', null,
                            React.createElement('td', { colSpan: "14", style: { textAlign: 'center' } }, 'No active orders found.') // Updated colspan
                        )
                    )
                )
            )
        )
    );
}

// --- SummaryCards Component (React) ---
function SummaryCards({ orders }) {
    const totalJobs = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + (parseInt(order['Total Items'], 10) || 0), 0);
    const totalLogos = orders.reduce((total, order) => total + (parseInt(order['Total Logos'], 10) || 0), 0);

    return (
        React.createElement('div', { className: "summary-cards", id: "summary-cards" },
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
            )
        )
    );
}


// --- Main App Component ---
function App() {
    const [orders, setOrders] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState(''); // State for search term

    React.useEffect(() => {
        fetchOrderData();
    }, []);

    const fetchOrderData = async () => {
        try {
            const response = await fetch('/api/active-orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Order data fetched in App component:', data);
            setOrders(data);
        } catch (error) {
            console.error('Error fetching order data in App component:', error);
            alert('Failed to load order data in React component.');
        }
    };

    const handleFileUpload = (newOrders) => {
        setOrders(newOrders); // Update orders state when new CSV is uploaded
        fetchOrderData(); // Re-fetch to ensure data is up-to-date from server - maybe not needed here as upload already returns data?
    };

    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm(''); // Clear search term
    };


    return (
        React.createElement('div', null,
            React.createElement('h1', null, 'Order Production Tracker'),
            React.createElement(Sidebar, { onFileUpload: handleFileUpload }), // Pass callback to Sidebar
            React.createElement(SearchBar, {
                searchTerm: searchTerm,
                onSearchChange: handleSearchChange,
                onClearSearch: handleClearSearch
            }), // Pass search props
            React.createElement(SummaryCards, { orders: orders }), // Pass orders to SummaryCards
            React.createElement(OrderTable, { orders: orders, searchTerm: searchTerm }) // Pass orders and searchTerm to OrderTable
        )
    );
}

// --- Render the App ---
const root = ReactDOM.createRoot(document.getElementById('order-table-root')); // Or any root div that contains all components, 'order-table-root' is fine if App's render starts there.
root.render(React.createElement(App));