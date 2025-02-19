// src/pages/components/OrderTable/OrderTable.js

// import React from 'react';

// --- OrderTable Component (UPDATED - Full Code with Row Expansion - SYNTAX ERROR FIXED) ---
function OrderTable({ orders, searchTerm }) {

    const filteredOrders = React.useMemo(() => {
        if (!searchTerm) {
            return orders;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        return orders.filter(order => {
            return Object.values(order).some(value => {
                if (value === null || value === undefined) return false;
                return String(value).toLowerCase().includes(lowerSearchTerm);
            });
        });
    }, [orders, searchTerm]);

    const [expandedRowSORD, setExpandedRowSORD] = React.useState(null);

    const handleRowClick = (sord) => {
        setExpandedRowSORD(expandedRowSORD === sord ? null : sord);
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
                                React.createElement('tr', { 
                                        onClick: () => handleRowClick(order.SORD),
                                        className: "data-row"
                                    },
                                    React.createElement('td', null, order.SORD),
                                    React.createElement('td', null, order["Trader Name"]),
                                    React.createElement('td', null, order["Total Items"]),
                                    React.createElement('td', null, order["Ordered Date"]),
                                    React.createElement('td', null, order["Due Date"]),
                                    React.createElement('td', null, order["Total Logos"]),
                                    React.createElement('td', null, order.jobStatus)
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
                                ),
                                expandedRowSORD === order.SORD ? ( 
                                    React.createElement('tr', { className: "expansion-row" },
                                        React.createElement('td', { colSpan: "14" },
                                            React.createElement('div', { className: "expansion-content" },
                                                'Expansion Content Here for SORD: ', order.SORD
                                            )
                                        )
                                    )
                                ) : null
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