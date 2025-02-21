// src/pages/components/OrderTable/OrderTable.js

function OrderTable({ orders, searchTerm, onItemCompletionChange }) {
  const [filteredOrders, setFilteredOrders] = React.useState([]);
  const [expandedRowSord, setExpandedRowSord] = React.useState(null);
  const [completedQuantities, setCompletedQuantities] = React.useState({});
  const [statusChanges, setStatusChanges] = React.useState({});
  // State for tracking expanded SWP parts per item
  const [expandedSwpParts, setExpandedSwpParts] = React.useState({});
  // State for capturing SWP part input values (keyed by sord, masterCode, and swpPart)
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
    // Prevent toggling if clicking on a select element
    if (event.target.tagName === 'SELECT') return;
    setExpandedRowSord(expandedRowSord === sord ? null : sord);
  };

  const handleCompletedQtyChange = (sord, masterCode, newCompletedQty) => {
    setCompletedQuantities(prevCompletedQuantities => {
      const orderQuantities = prevCompletedQuantities[sord] || {};
      const updatedOrderQuantities = {
        ...orderQuantities,
        [masterCode]: parseInt(newCompletedQty, 10) || 0
      };

      // Create updated order object
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
      return { ...prevCompletedQuantities, [sord]: updatedOrderQuantities };
    });
  };

  const handleStatusChange = (sord, field, newValue) => {
    setStatusChanges(prevStatusChanges => {
      const orderStatusChanges = prevStatusChanges[sord] || {};
      const updatedOrderStatusChanges = { ...orderStatusChanges, [field]: newValue };
      return { ...prevStatusChanges, [sord]: updatedOrderStatusChanges };
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

  // Handler for logging SWP completion and updating the master "Completed Qty"
  const handleLogSwpCompletion = (sord, masterCode, swpPart) => {
    const inputKey = `${sord}_${masterCode}_${swpPart}`;
    const inputValue = swpPartInputs[inputKey];
    const qtyToSet = parseInt(inputValue, 10);
    if (!qtyToSet || qtyToSet <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    // Find the order to update
    const orderToUpdate = orders.find(order => order.SORD === sord);
    if (!orderToUpdate) return;

    const updatedItemList = orderToUpdate["Item List"].map(item => {
      if (item["Master Code"] === masterCode) {
        // Get current logged value for this SWP part (defaulting to 0)
        const currentLogged =
          (item["swpPartCompletions"] &&
            item["swpPartCompletions"][swpPart] &&
            item["swpPartCompletions"][swpPart][0].qty) || 0;
        // Ensure we are not reducing the logged value
        const newQty = qtyToSet < currentLogged ? currentLogged : qtyToSet;
        // Overwrite any previous log with the new value for this SWP part
        const updatedSwpPartCompletions = {
          ...item["swpPartCompletions"],
          [swpPart]: [{ qty: newQty, timestamp: new Date().toISOString() }]
        };

        // Compute the new "Completed Qty" as the lowest logged value among all SWP parts
        const computedQty = item["SWP Parts"].reduce((min, part) => {
          // For each SWP part, get its logged quantity or default to 0 if not set
          const logged = (updatedSwpPartCompletions &&
                          updatedSwpPartCompletions[part] &&
                          updatedSwpPartCompletions[part][0]?.qty) || 0;
          return Math.min(min, logged);
        }, Infinity);
        const newCompletedQty = computedQty === Infinity ? 0 : computedQty;

        // Update local state so that the master line's Completed Qty reflects this new value
        setCompletedQuantities(prev => ({
          ...prev,
          [sord]: { ...(prev[sord] || {}), [masterCode]: newCompletedQty }
        }));

        return { ...item, swpPartCompletions: updatedSwpPartCompletions, "Completed Qty": newCompletedQty };
      }
      return item;
    });

    const updatedOrder = { ...orderToUpdate, "Item List": updatedItemList };
    onItemCompletionChange(sord, updatedOrder);
    // Update the input to show the newly logged value immediately
    setSwpPartInputs(prev => ({ ...prev, [inputKey]: qtyToSet.toString() }));
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

                                  isSwpExpanded && item["SWP Parts"].map((swpPart, index) => {
                                    const swpDescription = item["SWP Parts Desc"][index] || 'No Description';
                                    const inputKey = `${order.SORD}_${item["Master Code"]}_${swpPart}`;
                                    // Retrieve the logged quantity for this SWP part (default to 0 if none)
                                    const loggedValue = (item["swpPartCompletions"] &&
                                      item["swpPartCompletions"][swpPart] &&
                                      item["swpPartCompletions"][swpPart][0].qty) || 0;
                                    // Use the input state if available; otherwise, fallback to the logged value
                                    const inputValue =
                                      swpPartInputs[inputKey] !== undefined
                                        ? swpPartInputs[inputKey]
                                        : (loggedValue ? loggedValue.toString() : '');

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
                                            min: loggedValue,
                                            max: item["Outstanding Qty"],
                                            placeholder: "0",
                                            className: 'swp-completed-input',
                                            value: inputValue,
                                            onChange: (e) => {
                                              let newVal = parseInt(e.target.value, 10);
                                              if (isNaN(newVal)) {
                                                setSwpPartInputs(prev => ({ ...prev, [inputKey]: '' }));
                                                return;
                                              }
                                              if (newVal < loggedValue) {
                                                newVal = loggedValue;
                                              }
                                              if (newVal > item["Outstanding Qty"]) {
                                                newVal = item["Outstanding Qty"];
                                              }
                                              setSwpPartInputs(prev => ({ ...prev, [inputKey]: newVal.toString() }));
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
