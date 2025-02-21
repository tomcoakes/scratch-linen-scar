function OrderTable({ orders, searchTerm, onItemCompletionChange }) {
  const [filteredOrders, setFilteredOrders] = React.useState([]);
  const [expandedRowSord, setExpandedRowSord] = React.useState(null);
  const [completedQuantities, setCompletedQuantities] = React.useState({});
  const [statusChanges, setStatusChanges] = React.useState({});
  const [expandedSwpParts, setExpandedSwpParts] = React.useState({});
  // New state for capturing SWP part input values keyed by order+masterCode+swpPart
  const [swpPartInputs, setSwpPartInputs] = React.useState({});

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
    if (event.target.tagName === 'SELECT') return;
    setExpandedRowSord(expandedRowSord === sord ? null : sord);
  };

  const handleCompletedQtyChange = (sord, masterCode, newCompletedQty) => {
    setCompletedQuantities(prev => {
      const orderQuantities = prev[sord] || {};
      const updatedOrderQuantities = {
        ...orderQuantities,
        [masterCode]: parseInt(newCompletedQty, 10) || 0
      };
      const updatedOrder = {
        ...orders.find(order => order.SORD === sord),
        "Item List": orders.find(order => order.SORD === sord)["Item List"].map(item => {
          if (item["Master Code"] === masterCode) {
            return { ...item, "Completed Qty": updatedOrderQuantities[masterCode] || 0 };
          }
          return item;
        })
      };
      onItemCompletionChange(sord, updatedOrder);
      return { ...prev, [sord]: updatedOrderQuantities };
    });
  };

  const handleStatusChange = (sord, field, newValue) => {
    setStatusChanges(prev => {
      const orderStatusChanges = prev[sord] || {};
      const updatedOrderStatusChanges = { ...orderStatusChanges, [field]: newValue };
      return { ...prev, [sord]: updatedOrderStatusChanges };
    });
    const updatedOrder = {
      ...orders.find(order => order.SORD === sord),
      [field]: newValue
    };
    onItemCompletionChange(sord, updatedOrder);
  };

  const toggleSwpParts = (orderId, masterCode) => {
    const key = `${orderId}_${masterCode}`;
    setExpandedSwpParts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // NEW: Updated handler for logging SWP completion
  const handleLogSwpCompletion = (sord, masterCode, swpPart) => {
    const inputKey = `${sord}_${masterCode}_${swpPart}`;
    const inputValue = swpPartInputs[inputKey];
    const qtyToAdd = parseInt(inputValue, 10);
    if (!qtyToAdd || qtyToAdd <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    
    // Find the order and update its specific item
    const orderToUpdate = orders.find(order => order.SORD === sord);
    if (!orderToUpdate) return;
    
    const updatedItemList = orderToUpdate["Item List"].map(item => {
      if (item["Master Code"] === masterCode) {
        // Ensure swpPartCompletions exists
        const currentLogs = item["swpPartCompletions"] || {};
        // Clone the array for this SWP part or initialize it
        const swpLogs = currentLogs[swpPart] ? [...currentLogs[swpPart]] : [];
        swpLogs.push({ qty: qtyToAdd, timestamp: new Date().toISOString() });
        return { ...item, swpPartCompletions: { ...currentLogs, [swpPart]: swpLogs } };
      }
      return item;
    });
    
    const updatedOrder = { ...orderToUpdate, "Item List": updatedItemList };

    // Propagate the updated order back via the callback
    onItemCompletionChange(sord, updatedOrder);

    // Clear the input field after logging
    setSwpPartInputs(prev => ({ ...prev, [inputKey]: '' }));
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
                        (order.decorationMethod === "Embroidery" || order.decorationMethod === "Both") &&
                          React.createElement('span', { className: 'embroidery-tag' }, "Embroidery"),
                        (order.decorationMethod === "DTF" || order.decorationMethod === "Both") &&
                          React.createElement('span', { className: 'dtf-tag' }, "DTF")
                      ),
                      React.createElement('div', { className: 'status-dropdowns-container' },
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
                            React.createElement('option', { value: "Delayed" }, "Delayed")
                          )
                        ),
                        (order.decorationMethod === 'Embroidery' || order.decorationMethod === 'Both') &&
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
                          ),
                        (order.decorationMethod === 'DTF' || order.decorationMethod === 'Both') &&
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
                      )
                    )
                  )
                ),
                React.createElement('tr', { className: `expansion-row ${expandedRowSord === order.SORD ? 'expanded' : ''}` },
                  React.createElement('td', { colSpan: "14" },
                    React.createElement('div', { className: "expansion-content" },
                      React.createElement('div', { className: 'items-completed-section' },
                        React.createElement('h3', null, 'Items Completed'),
                        React.createElement('table', { className: 'items-completed-table' },
                          React.createElement('thead', null,
                            React.createElement('tr', null,
                              React.createElement('th', null, 'Qty'),
                              React.createElement('th', null, 'Item'),
                              React.createElement('th', null, 'Description'),
                              React.createElement('th', null, 'Completed')
                            )
                          ),
                          React.createElement('tbody', null,
                            order["Item List"].map(item => {
                              const initialCompletedQty = item["Completed Qty"] || 0;
                              const completedQty =
                                (completedQuantities[order.SORD] &&
                                  completedQuantities[order.SORD][item["Master Code"]]) ||
                                initialCompletedQty;
                              const isCompleted = completedQty >= item["Outstanding Qty"];
                              const key = `${order.SORD}_${item["Master Code"]}`;
                              const isSwpExpanded = expandedSwpParts[key];

                              return (
                                React.createElement(React.Fragment, { key: item["Master Code"] },
                                  React.createElement('tr', {
                                    className: `clickable ${isSwpExpanded ? 'expanded-active' : ''} ${isCompleted ? 'completed' : ''}`,
                                    onClick: () => toggleSwpParts(order.SORD, item["Master Code"])
                                  },
                                    React.createElement('td', null, item["Outstanding Qty"]),
                                    React.createElement('td', null, item["Master Code"]),
                                    React.createElement('td', null, item.Description),
                                    React.createElement('td', null, completedQty)
                                  ),
                                  // SWP Parts expansion:
                                  isSwpExpanded && item["SWP Parts"].map((swpPart, index) => {
                                    const swpDescription = item["SWP Parts Desc"][index] || 'No Description';
                                    const inputKey = `${order.SORD}_${item["Master Code"]}_${swpPart}`;
                                    return React.createElement('tr', {
                                      key: `${item["Master Code"]}_${swpPart}`,
                                      className: `swp-parts-row ${isSwpExpanded ? 'expanded-active' : ''}`
                                    },
                                      React.createElement('td', null, item["Outstanding Qty"]),
                                      React.createElement('td', null, swpPart),
                                      React.createElement('td', null, swpDescription),
                                      React.createElement('td', null,
                                        React.createElement('span', { className: 'swp-qty-input' },
                                          React.createElement('input', {
                                            type: "number",
                                            min: "0",
                                            max: item["Outstanding Qty"],
                                            placeholder: "0",
                                            className: 'swp-completed-input',
                                            value: swpPartInputs[inputKey] || '',
                                            onChange: (e) => {
                                              setSwpPartInputs(prev => ({ ...prev, [inputKey]: e.target.value }));
                                            }
                                          }),
                                          React.createElement('button', {
                                            className: 'log-completion-button',
                                            onClick: () => handleLogSwpCompletion(order.SORD, item["Master Code"], swpPart)
                                          }, "Log Completion")
                                        )
                                      )
                                    );
                                  })
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
