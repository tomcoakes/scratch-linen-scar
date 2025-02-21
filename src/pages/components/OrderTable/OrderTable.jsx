// import React, { useState, useEffect } from 'react';

function OrderTable({ orders, searchTerm, onItemCompletionChange }) {
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [expandedRowSord, setExpandedRowSord] = useState(null);
  const [completedQuantities, setCompletedQuantities] = useState({});
  const [statusChanges, setStatusChanges] = useState({});

  useEffect(() => {
    if (!searchTerm) {
      setFilteredOrders(orders);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filtered = orders.filter(order =>
        Object.values(order).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowerSearchTerm);
        })
      );
      setFilteredOrders(filtered);
    }
  }, [orders, searchTerm]);

  const handleRowClick = (sord, event) => {
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

      const updatedOrder = {
        ...orders.find(order => order.SORD === sord),
        "Item List": orders
          .find(order => order.SORD === sord)["Item List"]
          .map(item => {
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

  return (
    <div className="order-table-container">
      <h2>Active Orders (React Component!)</h2>
      <table id="orders-table">
        <thead>
          <tr>
            <th>SORD</th>
            <th>Trader Name</th>
            <th>Total Items</th>
            <th>Ordered Date</th>
            <th>Due Date</th>
            <th>Total Logos</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <React.Fragment key={order.SORD}>
                <tr
                  onClick={(event) => handleRowClick(order.SORD, event)}
                  className={`data-row ${expandedRowSord === order.SORD ? 'expanded' : ''}`}
                >
                  <td>{order.SORD}</td>
                  <td>{order["Trader Name"]}</td>
                  <td>{order["Total Items"]}</td>
                  <td>{order["Ordered Date"]}</td>
                  <td>{order["Due Date"]}</td>
                  <td>{order["Total Logos"]}</td>
                  <td>
                    <select
                      value={
                        (statusChanges[order.SORD] && statusChanges[order.SORD].jobStatus) ||
                        order.jobStatus
                      }
                      onChange={(e) => handleStatusChange(order.SORD, 'jobStatus', e.target.value)}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Started">Started</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Part Shipped">Part Shipped</option>
                      <option value="Complete">Complete</option>
                      <option value="Sent">Sent</option>
                    </select>
                  </td>
                </tr>
                <tr className={`info-row ${expandedRowSord === order.SORD ? 'expanded' : ''}`}>
                  <td colSpan="14">
                    <div className="info-container">
                      <div className="tags-container">
                        {order.isNew && <span className="new-tag">New</span>}
                        {(order.decorationMethod === "Embroidery" ||
                          order.decorationMethod === "Both") && (
                          <span className="embroidery-tag">Embroidery</span>
                        )}
                        {(order.decorationMethod === "DTF" ||
                          order.decorationMethod === "Both") && (
                          <span className="dtf-tag">DTF</span>
                        )}
                      </div>
                      <div className="status-dropdowns-container">
                        <div>
                          <label htmlFor={`garment-status-${order.SORD}`}>Garment:</label>
                          <select
                            id={`garment-status-${order.SORD}`}
                            value={
                              (statusChanges[order.SORD] &&
                                statusChanges[order.SORD].garmentStatus) ||
                              order.garmentStatus
                            }
                            onChange={(e) =>
                              handleStatusChange(order.SORD, 'garmentStatus', e.target.value)
                            }
                          >
                            <option value="">Select...</option>
                            <option value="Not Ordered">Not Ordered</option>
                            <option value="Ordered">Ordered</option>
                            <option value="Part Received">Part Received</option>
                            <option value="Booked in">Booked in</option>
                            <option value="Delayed">Delayed</option>
                            <option value="In Stock">In Stock</option>
                          </select>
                        </div>
                        {(order.decorationMethod === 'Embroidery' ||
                          order.decorationMethod === 'Both') && (
                          <div>
                            <label htmlFor={`embroidery-status-${order.SORD}`}>
                              Embroidery:
                            </label>
                            <select
                              id={`embroidery-status-${order.SORD}`}
                              value={
                                (statusChanges[order.SORD] &&
                                  statusChanges[order.SORD].embroideryFileStatus) ||
                                order.embroideryFileStatus
                              }
                              onChange={(e) =>
                                handleStatusChange(
                                  order.SORD,
                                  'embroideryFileStatus',
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select...</option>
                              <option value="On File">On File</option>
                              <option value="Not Ordered">Not Ordered</option>
                              <option value="Ordered">Ordered</option>
                              <option value="Arrived">Arrived</option>
                              <option value="Delayed">Delayed</option>
                              <option value="Fixing">Fixing</option>
                            </select>
                          </div>
                        )}
                        {(order.decorationMethod === 'DTF' ||
                          order.decorationMethod === 'Both') && (
                          <div>
                            <label htmlFor={`dtf-status-${order.SORD}`}>DTF:</label>
                            <select
                              id={`dtf-status-${order.SORD}`}
                              value={
                                (statusChanges[order.SORD] &&
                                  statusChanges[order.SORD].dtfStatus) ||
                                order.dtfStatus
                              }
                              onChange={(e) =>
                                handleStatusChange(order.SORD, 'dtfStatus', e.target.value)
                              }
                            >
                              <option value="">Select...</option>
                              <option value="In Stock">In Stock</option>
                              <option value="Not Started">Not Started</option>
                              <option value="On Press">On Press</option>
                              <option value="Printed">Printed</option>
                              <option value="Issues">Issues</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className={`expansion-row ${expandedRowSord === order.SORD ? 'expanded' : ''}`}>
                  <td colSpan="14">
                    <div className="expansion-content">
                      <div className="items-completed-section">
                        <h3>Items Completed</h3>
                        <table className="items-completed-table">
                          <thead>
                            <tr>
                              <th>Qty</th>
                              <th>Item</th>
                              <th>Completed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order["Item List"].map(item => {
                              const initialCompletedQty = item["Completed Qty"] || 0;
                              const completedQty =
                                (completedQuantities[order.SORD] &&
                                  completedQuantities[order.SORD][item["Master Code"]]) ||
                                initialCompletedQty;
                              const isCompleted = completedQty >= item["Outstanding Qty"];

                              return (
                                <tr key={item["Master Code"]} className={isCompleted ? 'completed' : ''}>
                                  <td>{item["Outstanding Qty"]}</td>
                                  <td>{item["Master Code"]}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      max={item["Outstanding Qty"]}
                                      value={completedQty}
                                      onChange={(e) =>
                                        handleCompletedQtyChange(
                                          order.SORD,
                                          item["Master Code"],
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="14" style={{ textAlign: 'center' }}>
                No active orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default OrderTable;
