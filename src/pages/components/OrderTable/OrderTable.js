// src/pages/components/OrderTable/OrderTable.js

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
        React.createElement('div', { className: "order-table-container" }, // Changed className to "order-table-container"
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

export default OrderTable; // Export the component