// src/pages/OrderTracker.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrderTracker.css'; // Import the CSS for this page

const OrderTracker = () => {
  // State to hold the orders data
  const [orders, setOrders] = useState([]);
  // Track which orders (by SORD) have their extra details expanded
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  // State for the CSV file chosen by the user
  const [csvFile, setCsvFile] = useState(null);
  // State for showing the new orders modal (after CSV upload)
  const [showNewOrdersModal, setShowNewOrdersModal] = useState(false);
  // Data for new orders that need user review (fields like decoration method, status, etc.)
  const [newOrdersData, setNewOrdersData] = useState([]);

  // Fetch orders when the component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch active orders from your API endpoint
  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/active-orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // When user selects a CSV file
  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  // Upload the CSV file to your API endpoint
  const handleUploadCsv = async () => {
    if (!csvFile) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target.result;
      try {
        // POST the CSV text to the upload endpoint
        const res = await axios.post('/api/upload-orders', csvText, {
          headers: { 'Content-Type': 'text/csv' },
        });
        const updatedOrders = res.data;
        // Identify new orders (assuming new orders have isNew: true)
        const newOrders = updatedOrders.filter(order => order.isNew);
        setOrders(updatedOrders);
        if (newOrders.length > 0) {
          setNewOrdersData(newOrders);
          setShowNewOrdersModal(true);
        }
      } catch (error) {
        console.error('Error uploading CSV:', error);
      }
    };
    reader.readAsText(csvFile);
  };

  // Toggle the expansion of order details when a row is clicked
  const toggleRowExpansion = (sord) => {
    setExpandedOrderIds(prev =>
      prev.includes(sord)
        ? prev.filter(id => id !== sord)
        : [...prev, sord]
    );
  };

  // Handler for changes made in the new orders modal
  const handleNewOrderChange = (sord, field, value) => {
    setNewOrdersData(prev =>
      prev.map(order => order.SORD === sord ? { ...order, [field]: value } : order)
    );
  };

  // Save the new orders data after user review
  const saveNewOrders = () => {
    // For now, update the orders state with the changes from the modal.
    // In a real application, you would send these updates to your server.
    const updatedOrders = orders.map(order => {
      const newOrder = newOrdersData.find(no => no.SORD === order.SORD);
      return newOrder ? newOrder : order;
    });
    setOrders(updatedOrders);
    setShowNewOrdersModal(false);
  };

  return (
    <div className="order-tracker-container">
      <h2>Order Production Tracker</h2>
      
      {/* CSV Upload Section */}
      <div className="upload-section">
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button onClick={handleUploadCsv}>Upload CSV</button>
      </div>
      
      {/* Main Orders Table */}
      <table className="orders-table">
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
          {orders.map(order => (
            <React.Fragment key={order.SORD}>
              <tr className="order-row" onClick={() => toggleRowExpansion(order.SORD)}>
                <td>{order.SORD}</td>
                <td>{order["Trader Name"]}</td>
                <td>{order["Total Items"]}</td>
                <td>{order["Ordered Date"] || '-'}</td>
                <td>{order["Due Date"] || '-'}</td>
                <td>{order["Total Logos"]}</td>
                <td>
                  <select
                    value={order.jobStatus}
                    // Prevent the dropdown click from toggling the row expansion
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setOrders(prev =>
                        prev.map(o =>
                          o.SORD === order.SORD ? { ...o, jobStatus: newStatus } : o
                        )
                      );
                    }}
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
              {/* Expanded Row with Additional Details */}
              {expandedOrderIds.includes(order.SORD) && (
                <tr className="order-details-row">
                  <td colSpan="7">
                    <div className="order-details">
                      <div>
                        <strong>Garment Status:</strong>
                        <select
                          value={order.garmentStatus}
                          onChange={(e) => {
                            const newVal = e.target.value;
                            setOrders(prev =>
                              prev.map(o =>
                                o.SORD === order.SORD ? { ...o, garmentStatus: newVal } : o
                              )
                            );
                          }}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Stock">In Stock</option>
                          <option value="Not Ordered">Not Ordered</option>
                          <option value="Ordered">Ordered</option>
                          <option value="Part Received">Part Received</option>
                          <option value="Booked in">Booked in</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </div>
                      <div>
                        <strong>Decoration Method:</strong>
                        <select
                          value={order.decorationMethod}
                          onChange={(e) => {
                            const newVal = e.target.value;
                            setOrders(prev =>
                              prev.map(o =>
                                o.SORD === order.SORD ? { ...o, decorationMethod: newVal } : o
                              )
                            );
                          }}
                        >
                          <option value="">Select</option>
                          <option value="Embroidery">Embroidery</option>
                          <option value="DTF">DTF</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                      {(order.decorationMethod === 'Embroidery' || order.decorationMethod === 'Both') && (
                        <div>
                          <strong>Embroidery File Status:</strong>
                          <select
                            value={order.embroideryFileStatus}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setOrders(prev =>
                                prev.map(o =>
                                  o.SORD === order.SORD ? { ...o, embroideryFileStatus: newVal } : o
                                )
                              );
                            }}
                          >
                            <option value="">Select</option>
                            <option value="On File">On File</option>
                            <option value="Not Ordered">Not Ordered</option>
                            <option value="Ordered">Ordered</option>
                            <option value="Arrived">Arrived</option>
                            <option value="Delayed">Delayed</option>
                            <option value="Fixing">Fixing</option>
                          </select>
                        </div>
                      )}
                      {(order.decorationMethod === 'DTF' || order.decorationMethod === 'Both') && (
                        <div>
                          <strong>DTF Status:</strong>
                          <select
                            value={order.dtfStatus}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setOrders(prev =>
                                prev.map(o =>
                                  o.SORD === order.SORD ? { ...o, dtfStatus: newVal } : o
                                )
                              );
                            }}
                          >
                            <option value="">Select</option>
                            <option value="In Stock">In Stock</option>
                            <option value="Not Started">Not Started</option>
                            <option value="On Press">On Press</option>
                            <option value="Printed">Printed</option>
                            <option value="Issues">Issues</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <strong>Back Order Items:</strong>
                        <div className="backorder-items">
                          {order["Item List"] && order["Item List"].map(item => (
                            <label key={item["Master Code"]}>
                              <input type="checkbox" />{' '}
                              {item["Master Code"]} - {item.Description}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <strong>Items Completed:</strong>
                        <div className="items-completed">
                          {order["Item List"] && order["Item List"].map(item => (
                            <label key={item["Master Code"]}>
                              <input type="checkbox" />{' '}
                              {item["Master Code"]}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Modal for Reviewing New Orders (after CSV upload) */}
      {showNewOrdersModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Review New Orders</h3>
            {newOrdersData.map(order => (
              <div key={order.SORD} className="modal-order-item">
                <p>
                  <strong>{order.SORD} - {order["Trader Name"]}</strong>
                </p>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={order.isNew}
                      onChange={(e) =>
                        handleNewOrderChange(order.SORD, 'isNew', e.target.checked)
                      }
                    />{' '}
                    New Order
                  </label>
                </div>
                <div>
                  <label>
                    Garment Status:{' '}
                    <select
                      value={order.garmentStatus}
                      onChange={(e) =>
                        handleNewOrderChange(order.SORD, 'garmentStatus', e.target.value)
                      }
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Stock">In Stock</option>
                      <option value="Not Ordered">Not Ordered</option>
                      <option value="Ordered">Ordered</option>
                      <option value="Part Received">Part Received</option>
                      <option value="Booked in">Booked in</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label>
                    Decoration Method:{' '}
                    <select
                      value={order.decorationMethod}
                      onChange={(e) =>
                        handleNewOrderChange(order.SORD, 'decorationMethod', e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      <option value="Embroidery">Embroidery</option>
                      <option value="DTF">DTF</option>
                      <option value="Both">Both</option>
                    </select>
                  </label>
                </div>
                {(order.decorationMethod === 'Embroidery' ||
                  order.decorationMethod === 'Both') && (
                  <div>
                    <label>
                      Embroidery File Status:{' '}
                      <select
                        value={order.embroideryFileStatus}
                        onChange={(e) =>
                          handleNewOrderChange(
                            order.SORD,
                            'embroideryFileStatus',
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select</option>
                        <option value="On File">On File</option>
                        <option value="Not Ordered">Not Ordered</option>
                        <option value="Ordered">Ordered</option>
                        <option value="Arrived">Arrived</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Fixing">Fixing</option>
                      </select>
                    </label>
                  </div>
                )}
                {(order.decorationMethod === 'DTF' ||
                  order.decorationMethod === 'Both') && (
                  <div>
                    <label>
                      DTF Status:{' '}
                      <select
                        value={order.dtfStatus}
                        onChange={(e) =>
                          handleNewOrderChange(order.SORD, 'dtfStatus', e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Not Started">Not Started</option>
                        <option value="On Press">On Press</option>
                        <option value="Printed">Printed</option>
                        <option value="Issues">Issues</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>
            ))}
            <button onClick={saveNewOrders}>Save New Orders</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracker;
