// src/pages/components/OrderTable/OrderTable.js

function OrderTable({ orders, searchTerm, onItemCompletionChange }) {
    const [filteredOrders, setFilteredOrders] = React.useState([]);
    const [expandedRowSord, setExpandedRowSord] = React.useState(null);
    const [completedQuantities, setCompletedQuantities] = React.useState({});
    const [statusChanges, setStatusChanges] = React.useState({});

    React.useEffect(() => {
        if (!searchTerm) {
            setFilteredOrders(orders);
        } else {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const filtered = orders.filter(order => {
                return Object.values(order).some(value => {
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(lowerSearchTerm);
                });
            });
            setFilteredOrders(filtered);
        }
    }, [orders, searchTerm]);

    const handleRowClick = (sord) => {
        setExpandedRowSord(expandedRowSord === sord ? null : sord);
    };

    const handleCompletedQtyChange = (sord, masterCode, newCompletedQty) => {
      // ... (same as before) ...
    };

    const handleStatusChange = (sord, field, newValue) => {
      // ... (same as before) ...
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
                                    className: `${expandedRowSord === order.SORD ? 'expanded' : ''}`
                                },
                                    React.createElement('td', null, order.SORD),
                                    React.createElement('td', null, order["Trader Name"]),
                                    React.createElement('td', null, order["Total Items"]),
                                    React.createElement('td', null, order["Ordered Date"]),
                                    React.createElement('td', null, order["Due Date"]),
                                    React.createElement('td', null, order["Total Logos"]),
                                    React.createElement('td', null, order.jobStatus)
                                ),
                                React.createElement('tr', {
                                    className: `info-row ${expandedRowSord === order.SORD ? 'expanded' : ''}`
                                },
                                    React.createElement('td', { colSpan: "14" },
                                        React.createElement('div', { className: "info-container" },
                                            React.createElement('div', { className: "tags-container" },
                                                order.isNew ? React.createElement('span', { className: "new-tag" }, 'New') : null,
                                                order.decorationMethod === "Embroidery" || order.decorationMethod === "Both" ? React.createElement('span', {className: 'embroidery-tag'}, "Embroidery") : null,
                                                order.decorationMethod === "DTF" || order.decorationMethod === "Both" ? React.createElement('span', {className: 'dtf-tag'}, "DTF") : null
                                            ),
                                            React.createElement('div', {className: 'status-dropdowns-container'},
                                                React.createElement('div', null, // Wrap label and select in a div
                                                    React.createElement('label', { htmlFor: `garment-status-${order.SORD}` }, 'Garment:'), // Label
                                                    React.createElement('select', {
                                                        id: `garment-status-${order.SORD}`, // Unique ID
                                                        value: (statusChanges[order.SORD] && statusChanges[order.SORD].garmentStatus) || order.garmentStatus,
                                                        onChange: (e) => handleStatusChange(order.SORD, 'garmentStatus', e.target.value)
                                                        },
                                                        React.createElement('option', { value: "Not Started" }, "Not Started"),
                                                        React.createElement('option', { value: "Not Ordered" }, "Not Ordered"),
                                                        React.createElement('option', { value: "Ordered" }, "Ordered"),
                                                        React.createElement('option', { value: "Part Received" }, "Part Received"),
                                                        React.createElement('option', { value: "Booked in" }, "Booked in"),
                                                        React.createElement('option', { value: "Delayed" }, "Delayed"),
                                                        React.createElement('option', { value: "In Stock" }, "In Stock")
                                                    )
                                                ),
                                                order.decorationMethod === 'Embroidery' || order.decorationMethod === 'Both' ? (
                                                    React.createElement('div', null, // Wrap label and select
                                                        React.createElement('label', { htmlFor: `embroidery-status-${order.SORD}` }, 'Embroidery:'), // Label
                                                        React.createElement('select', {
                                                            id: `embroidery-status-${order.SORD}`, // Unique ID
                                                            value: (statusChanges[order.SORD] && statusChanges[order.SORD].embroideryFileStatus) || order.embroideryFileStatus,
                                                            onChange: (e) => handleStatusChange(order.SORD, 'embroideryFileStatus', e.target.value)
                                                        },
                                                            React.createElement('option', { value: "" }, "Select..."),
                                                            React.createElement('option', { value: "On File" }, "On File"),
                                                            React.createElement('option', { value: "Not Ordered" }, "Not Ordered"),
                                                            React.createElement('option', { value: "Ordered" }, "Ordered"),
                                                            React.createElement('option', { value: "Arrived" }, "Arrived"),
                                                            React.createElement('option', { value: "Delayed" }, "Delayed"),
                                                            React.createElement('option', { value: "Fixing" }, "Fixing")
                                                        )
                                                    )
                                                ) : null,
                                                order.decorationMethod === 'DTF' || order.decorationMethod === 'Both' ? (
                                                    React.createElement('div', null, // Wrap label and select
                                                        React.createElement('label', { htmlFor: `dtf-status-${order.SORD}` }, 'DTF:'), // Label
                                                        React.createElement('select', {
                                                            id: `dtf-status-${order.SORD}`, // Unique ID
                                                            value: (statusChanges[order.SORD] && statusChanges[order.SORD].dtfStatus) || order.dtfStatus,
                                                            onChange: (e) => handleStatusChange(order.SORD, 'dtfStatus', e.target.value)
                                                        },
                                                            React.createElement('option', { value: "" }, "Select..."),
                                                            React.createElement('option', { value: "In Stock" }, "In Stock"),
                                                            React.createElement('option', { value: "Not Started" }, "Not Started"),
                                                            React.createElement('option', { value: "On Press" }, "On Press"),
                                                            React.createElement('option', { value: "Printed" }, "Printed"),
                                                            React.createElement('option', { value: "Issues" }, "Issues")
                                                        )
                                                    )
                                                ) : null
                                            )
                                        )
                                    )
                                ),
                                React.createElement('tr', { className: `expansion-row ${expandedRowSord === order.SORD ? 'expanded' : ''}` },
                                    React.createElement('td', { colSpan: "14" },
                                        React.createElement('div', { className: "expansion-content" },
                                            React.createElement('div', {className: 'back-order-section'},
                                                React.createElement('h3', null, 'Back Order Items'),
                                                React.createElement('p', null, order["Other Parts"] ? order["Other Parts"].join(', ') : "None")
                                            ),
                                            React.createElement('div', { className: 'items-completed-section' },
                                                React.createElement('h3', null, 'Items Completed'),
                                                React.createElement('table', { className: 'items-completed-table' },
                                                    React.createElement('thead', null,
                                                        React.createElement('tr', null,
                                                            React.createElement('th', null, 'Qty'),
                                                            React.createElement('th', null, 'Item'),
                                                            React.createElement('th', null, 'Completed')
                                                        )
                                                    ),
                                                    React.createElement('tbody', null,
                                                        order["Item List"].map(item => {
                                                          const initialCompletedQty = item["Completed Qty"] || 0;
                                                          const completedQty = (completedQuantities[order.SORD] && completedQuantities[order.SORD][item["Master Code"]]) || initialCompletedQty;
                                                          const isCompleted = completedQty >= item["Outstanding Qty"];

                                                            return (
                                                                React.createElement('tr', { key: item["Master Code"], className: isCompleted ? 'completed' : '' },
                                                                    React.createElement('td', null, item["Outstanding Qty"]),
                                                                    React.createElement('td', null, item["Master Code"]),
                                                                    React.createElement('td', null,
                                                                        React.createElement('input', {
                                                                            type: "number",
                                                                            min: "0",
                                                                            max: item["Outstanding Qty"],
                                                                            value: completedQty,
                                                                            onChange: (e) => handleCompletedQtyChange(order.SORD, item["Master Code"], e.target.value)

                                                                        })
                                                                    )
                                                                )
                                                            );
                                                        })
                                                    )
                                                )
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