// src/pages/tracker.js

// ... (keep your import statements and workaround for globals at the top) ...

// --- OrderTable Component (UPDATED to fetch data) ---
function OrderTable() {
    const [orders, setOrders] = React.useState([]); // <-- ADD REACT STATE!

    React.useEffect(() => { // <-- ADD useEffect HOOK!
        fetchOrderData(); // Call fetchOrderData when component mounts
    }, []); // Empty dependency array means this effect runs only once on mount


    async function fetchOrderData() { // <-- EXTRACTED fetchOrderData FUNCTION
        try {
            const response = await fetch('/api/active-orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Order data fetched in React component:', data); // Log fetched data
            setOrders(data); // <-- UPDATE STATE with fetched data!

        } catch (error) {
            console.error('Error fetching order data in React component:', error);
            alert('Failed to load order data in React component.');
        }
    }


    return (
        React.createElement('div', null,
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
                React.createElement('tbody', null, // Table body - now dynamic!
                    orders.map(order => ( // <-- MAP OVER ORDERS ARRAY!
                        React.createElement('tr', { key: order.SORD }, // Unique key for each row
                            React.createElement('td', null, order.SORD),
                            React.createElement('td', null, order["Trader Name"]),
                            React.createElement('td', null, order["Total Items"]),
                            React.createElement('td', null, order["Ordered Date"]),
                            React.createElement('td', null, order["Due Date"]),
                            React.createElement('td', null, order["Total Logos"])
                            // ... (ADD MORE TABLE CELLS HERE LATER) ...
                        )
                    ))
                )
            )
        )
    );
}

// --- Main App Component (No changes needed here) ---
function App() {
    return (
        React.createElement('div', null,
            React.createElement('h1', null, 'Order Production Tracker'),
            React.createElement(OrderTable, null) // Include the OrderTable component
        )
    );
}

// --- Render the App (No changes needed here) ---
const root = ReactDOM.createRoot(document.getElementById('order-table-root'));
root.render(React.createElement(App));