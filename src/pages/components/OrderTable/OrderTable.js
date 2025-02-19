function OrderTable({ orders, searchTerm }) {
    const [filteredOrders, setFilteredOrders] = React.useState([]); // <-- REMOVE useMemo
    const [expandedRowSord, setExpandedRowSord] = React.useState(null); // <-- State for expanded row

    React.useEffect(() => { // <-- useEffect for filtering - REPLACING useMemo
        if (!searchTerm) {
            setFilteredOrders(orders); // No search term, show all orders
        } else {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const filtered = orders.filter(order => {
                return Object.values(order).some(value => {
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(lowerSearchTerm);
                });
            });
            setFilteredOrders(filtered); // Update filteredOrders state
        }
    }, [orders, searchTerm]); // Re-filter when orders or searchTerm change


    const handleRowClick = (sord) => { // <-- ADD THIS FUNCTION
        setExpandedRowSord(expandedRowSord === sord ? null : sord); // Toggle expandedRowSord
    };


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
                        React.createElement('th', null, 'Status')
                    )
                ),
                React.createElement('tbody', null,
                    filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                            React.createElement(React.Fragment, { key: order.SORD },
                                React.createElement('tr', { onClick: () => handleRowClick(order.SORD) }, // <-- ADD onClick handler
                                    React.createElement('td', null, order.SORD),
                                    React.createElement('td', null, order["Trader Name"]),
                                    React.createElement('td', null, order["Total Items"]),
                                    React.createElement('td', null, order["Ordered Date"]),
                                    React.createElement('td', null, order["Due Date"]),
                                    React.createElement('td', null, order["Total Logos"]),
                                    React.createElement('td', null, order.jobStatus)
                                ),
                                React.createElement('tr', { className: `expansion-row ${expandedRowSord === order.SORD ? 'expanded' : ''}` }, // <-- Expansion row, conditional 'expanded' class
                                    React.createElement('td', { colSpan: "14" }, // Span all columns
                                        React.createElement('div', { className: "expansion-content" }, // Container for expansion content
                                            React.createElement('p', null, `Expansion content for SORD: ${order.SORD} - PLACEHOLDER`) // Placeholder content
                                        )
                                    )
                                ),
                                React.createElement('tr', { className: "info-row" },
                                    React.createElement('td', { colSpan: "14" },
                                        React.createElement('div', { className: "info-container" },
                                            React.createElement('div', { className: "tags-container" },
                                                order.isNew ? React.createElement('span', { className: "new-tag" }, 'New') : null
                                            ),
                                            React.createElement('div', { className: "decoration-container" },
                                                order.decorationMethod
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

export default OrderTable;