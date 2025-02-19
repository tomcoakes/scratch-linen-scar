// src/pages/components/OrderTable/OrderTable.js

// --- OrderTable Component (UPDATED to fetch data and filter) ---
function OrderTable({ orders, searchTerm }) { // Receive orders and searchTerm as props

    console.log("OrderTable component received props:", { orders, searchTerm }); // *** ADD THIS LOG ***

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
        React.createElement('div', { className: "order-table-container" },
            React.createElement('h2', null, 'Active Orders (React Component!)'),
            React.createElement('table', { id: 'orders-table' },
                React.createElement('thead', null,
                    React.createElement('tr', null,
                        React.createElement('th', null, 'SORD'),
                        React.createElement('th', null, 'Trader Name'),
                        React.createElement('th', null, 'Total Items'),
                        React.createElement('th', null, 'Ordered Date'),
                        React.createElement('th', null, 'Due Date'),
                        React.createElement('th', null, 'Total Logos'),
                        React.createElement('th', null, 'Status')       // <-- KEEP "Status" HEADER
                        // ... (ADD MORE TABLE HEADERS HERE LATER) ...
                    )
                ),
                React.createElement('tbody', null,
                    filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                            React.createElement(React.Fragment, { key: order.SORD }, // Use React.Fragment to group rows without extra DOM element
                                React.createElement('tr', null, // --- Main Data Row ---
                                    React.createElement('td', null, order.SORD),
                                    React.createElement('td', null, order["Trader Name"]),
                                    React.createElement('td', null, order["Total Items"]),
                                    React.createElement('td', null, order["Ordered Date"]),
                                    React.createElement('td', null, order["Due Date"]),
                                    React.createElement('td', null, order["Total Logos"]),
                                    React.createElement('td', null, order.jobStatus)      // <-- Job Status Column
                                    // ... (ADD MORE TABLE CELLS HERE LATER) ...
                                ),
                                React.createElement('tr', { className: "info-row" }, // --- Info Row (Tags and Decoration) ---
                                    React.createElement('td', { colSpan: "14" }, // <-- colSpan to span all columns
                                        React.createElement('div', { className: "info-container" }, // Container for tags and decoration
                                            React.createElement('div', { className: "tags-container" }, // Container for tags
                                                order.isNew ? React.createElement('span', { className: "new-tag" }, 'New') : null // "New" Tag
                                            ),
                                            React.createElement('div', { className: "decoration-container" }, // Container for decoration
                                                order.decorationMethod // Decoration Method
                                            )
                                        )
                                    )
                                )
                            )
                        ))
                    ) : (
                        React.createElement('tr', null,
                            React.createElement('td', { colSpan: "14", style: { textAlign: 'center' } }, 'No active orders found.')
                        )
                    )
                )
            )
        )
    );
}

export default OrderTable; // Export the component