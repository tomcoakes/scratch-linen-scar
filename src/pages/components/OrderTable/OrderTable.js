// src/pages/components/OrderTable/OrderTable.js

// import React from 'react';  // REMOVE THIS LINE - No longer needed
// import BackOrderPopup from '../BackOrderPopup/BackOrderPopup.js'; // REMOVE THIS LINE
// import styles from './OrderTable.module.css'; // REMOVE THIS LINE - Not directly using CSS Modules in this example

// --- OrderTable Component (UPDATED - Removed Back Order Features) ---
function OrderTable({ orders, searchTerm, onItemCompletionChange }) {
    const [filteredOrders, setFilteredOrders] = React.useState([]);
    const [expandedRowSord, setExpandedRowSord] = React.useState(null);
    const [completedQuantities, setCompletedQuantities] = React.useState({});
    const [statusChanges, setStatusChanges] = React.useState({});
    // const [showBackOrderPopup, setShowBackOrderPopup] = React.useState(false); // REMOVE THIS LINE

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

    const handleRowClick = (sord, event) => {
        if (event.target.tagName === 'SELECT') {
            return;
        }
        setExpandedRowSord(expandedRowSord === sord ? null : sord);
    };

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

    // --- NEW: Function to handle status changes ---
    const handleStatusChange = (sord, field, newValue) => {
        setStatusChanges(prevStatusChanges => {
            const orderStatusChanges = prevStatusChanges[sord] || {};
            const updatedOrderStatusChanges = { ...orderStatusChanges, [field]: newValue };
            return { ...prevStatusChanges, [sord]: updatedOrderStatusChanges };
        });

        // --- Create updated order object ---
        const updatedOrder = {
            ...orders.find(order => order.SORD === sord), // Find the order
            [field]: newValue
          };

        // Call the callback prop with the updated order
        onItemCompletionChange(sord, updatedOrder);
    };

    // --- REMOVE THIS FUNCTION COMPLETELY - Placeholder function for Back Order Submit ---
    // const handleBackOrderSubmit = (updatedOrder) => { // Placeholder function for now
    //     console.log("Back order submitted!", updatedOrder);
    //     setShowBackOrderPopup(false); // Just close the popup for now
    // };


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
                                    onClick: (event) => handleRowClick(order.SORD, event),
                                    className: `data-row ${expandedRowSord === order.SORD ? 'expanded' : ''}`
                                },
                                    React.createElement('td', null, order.SORD),
                                    React.createElement('td', null, order["Trader Name"]),
                                    React.createElement('td', null, order["Total Items"]),
                                    React.createElement('td', null, order["Ordered Date"]),
                                    React.createElement('td', null, order["Due Date"]),
                                    React.createElement('td', null, order["Total Logos"]),
                                    React.createElement('td', null,
                                        React.createElement('select', {
                                            value: (statusChanges[order.SORD] && statusChanges[order.SORD].jobStatus) || order.jobStatus,
                                            onChange: (e) => handleStatusChange(order.SORD, 'jobStatus', e.target.value)
                                        },
                                            React.createElement('option', { value: "Not Started" }, "Not Started"),
                                            React.createElement('option', { value: "Started" }, "Started"),
                                            React.createElement('option', { value: "On Hold" }, "On Hold"),
                                            React.createElement('option', { value: "Part Shipped" }, "Part Shipped"),
                                            React.createElement('option', { value: "Complete" }, "Complete"),
                                            React.createElement('option', { value: "Sent" }, "Sent")
                                        )
                                    )
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
                                                React.createElement('div', null,
                                                    React.createElement('label', { htmlFor: `garment-status-${order.SORD}` }, 'Garment:'),
                                                    React.createElement('select', {
                                                        id: `garment-status-${order.SORD}`,
                                                        value: (statusChanges[order.SORD] && statusChanges[order.SORD].garmentStatus) || order.garmentStatus,
                                                        onChange: (e) => handleStatusChange(order.SORD, 'garmentStatus', e.target.value)
                                                        },
                                                        React.createElement('option', { value: "" }, "Select..."),
                                                        React.createElement('option', { value: "Not Ordered" }, "Not Ordered"),
                                                        React.createElement('option', { value: "Ordered" }, "Ordered"),
                                                        React.createElement('option', { value: "Part Received" }, "Part Received"),
                                                        React.createElement('option', { value: "Booked in" }, "Booked in"),
                                                        React.createElement('option', { value: "Delayed" }, "Delayed"),
                                                        React.createElement('option', { value: "In Stock" }, "In Stock")
                                                    )
                                                ),
                                                order.decorationMethod === 'Embroidery' || order.decorationMethod === 'Both' ? (
                                                    React.createElement('div', null,
                                                        React.createElement('label', { htmlFor: `embroidery-status-${order.SORD}` }, 'Embroidery:'),
                                                        React.createElement('select', {
                                                            id: `embroidery-status-${order.SORD}`,
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
                                                    React.createElement('div', null,
                                                        React.createElement('label', { htmlFor: `dtf-status-${order.SORD}` }, 'DTF:'),
                                                        React.createElement('select', {
                                                            id: `dtf-status-${order.SORD}`,
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
                                            // --- REMOVE THIS SECTION COMPLETELY - Back Order Section ---
                                            // React.createElement('div', {className: 'back-order-section'},
                                            //     React.createElement('h3', null, 'Back Order Items'),
                                            //     React.createElement('p', null, order["Other Parts"] ? order["Other Parts"].join(', ') : "None"),
                                            //     React.createElement('button', {
                                            //         onClick: () => setShowBackOrderPopup(true) // Show popup on click
                                            //     }, "Add Back Order Items")
                                            // ),
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
                                                                            value: completedQty,
                                                                            onChange: (e) => handleCompletedQtyChange(order.SORD, item["Master Code"], e.target.value)

                                                                        })
                                                                    )
                                                                )
                                                            );
                                                        })
                                                    )
                                                )
                                            ),
                                            // --- REMOVE THIS LINE COMPLETELY - BackOrderPopup Conditionally Rendered Here - PROPS ADDED! ---
                                            // showBackOrderPopup ? React.createElement(BackOrderPopup, {
                                            //     order: order, // Pass the entire order object as a prop
                                            //     onClose: () => setShowBackOrderPopup(false), // Pass onClose function
                                            //     onSubmit: handleBackOrderSubmit // Pass onSubmit placeholder function
                                            // }) : null  // REMOVE THIS LINE COMPLETELY
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