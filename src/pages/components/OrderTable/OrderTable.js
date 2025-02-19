// src/pages/components/OrderTable/OrderTable.js

// --- OrderTable Component (UPDATED - Input Initialization from JSON) ---
function OrderTable({ orders, searchTerm, onItemCompletionChange }) { // Receive onItemCompletionChange prop
    const [filteredOrders, setFilteredOrders] = React.useState([]);
    const [expandedRowSord, setExpandedRowSord] = React.useState(null);
    const [completedQuantities, setCompletedQuantities] = React.useState({}); // { [sord]: { [masterCode]: completedQty, ... }, ... }

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

    // --- MODIFIED: Function to handle changes in completed quantity input ---
    const handleCompletedQtyChange = (sord, masterCode, newCompletedQty) => {
      setCompletedQuantities(prevCompletedQuantities => {
          const orderQuantities = prevCompletedQuantities[sord] || {};
          const updatedOrderQuantities = { ...orderQuantities, [masterCode]: parseInt(newCompletedQty, 10) || 0 };

          // --- Create updated order object ---
          const updatedOrder = {
              ...orders.find(order => order.SORD === sord), // Find the order
              "Item List": orders.find(order => order.SORD === sord)["Item List"].map(item => { // Update Item List
                  if (item["Master Code"] === masterCode) {
                      return { ...item, "Completed Qty": updatedOrderQuantities[masterCode] || 0 }; // Update Completed Qty
                  }
                  return item;
              })
          };

        // Call the callback prop with the updated order
        onItemCompletionChange(sord, updatedOrder);

        return { ...prevCompletedQuantities, [sord]: updatedOrderQuantities };
    });
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
                                }, // --- Main Data Row ---
                                    React.createElement('td', null, order.SORD),
                                    React.createElement('td', null, order["Trader Name"]),
                                    React.createElement('td', null, order["Total Items"]),
                                    React.createElement('td', null, order["Ordered Date"]),
                                    React.createElement('td', null, order["Due Date"]),
                                    React.createElement('td', null, order["Total Logos"]),
                                    React.createElement('td', null, order.jobStatus)
                                ),
                                React.createElement('tr', {
                                    className: `info-row ${expandedRowSord === order.SORD ? 'expanded' : ''}` // <-- CORRECTED: Apply 'expanded' class based on expandedRowSord
                                }, // --- Info Row (Tags and Decoration) ---
                                    React.createElement('td', { colSpan: "14" }, // Span all columns
                                        React.createElement('div', { className: "info-container" }, // Container for tags and decoration
                                            React.createElement('div', { className: "tags-container" }, // Container for tags
                                                order.isNew ? React.createElement('span', { className: "new-tag" }, 'New') : null // "New" Tag
                                            ),
                                            React.createElement('div', { className: "decoration-container" }, // Container for decoration
                                                order.decorationMethod // Decoration Method
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
                                            React.createElement('div', {className: 'garment-status-section'},
                                                React.createElement('h3', null, 'Garment Status'),
                                                React.createElement('p', null, order.garmentStatus),
                                            ),
                                            order.decorationMethod === 'Embroidery' || order.decorationMethod === 'Both' ? (
                                                React.createElement('div', {className: 'embroidery-status-section'},
                                                    React.createElement('h3', null, 'Embroidery Status'),
                                                    React.createElement('p', null, order.embroideryFileStatus)
                                                )
                                            ) : null,
                                            order.decorationMethod === 'DTF' || order.decorationMethod === 'Both' ? (
                                                React.createElement('div', {className: 'dtf-status-section'},
                                                    React.createElement('h3', null, 'DTF Status'),
                                                    React.createElement('p', null, order.dtfStatus)
                                                )
                                            ) : null,
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
                                                          const completedQty = (completedQuantities[order.SORD] && completedQuantities[order.SORD][item["Master Code"]]) || initialCompletedQty; // Get completed qty, default to initialCompletedQty
                                                          const isCompleted = completedQty >= item["Outstanding Qty"];

                                                            return (
                                                                React.createElement('tr', { key: item["Master Code"], className: isCompleted ? 'completed' : '' }, // Conditionally apply 'completed' class
                                                                    React.createElement('td', null, item["Outstanding Qty"]),
                                                                    React.createElement('td', null, item["Master Code"]),
                                                                    React.createElement('td', null,
                                                                        React.createElement('input', {
                                                                            type: "number",
                                                                            min: "0",
                                                                            max: item["Outstanding Qty"],
                                                                            value: completedQty,   // Now correctly initialized and updated
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