// Remove any import statements since React is loaded from the CDN.
// Instead, we get useState and useEffect from the global React variable.
const { useState, useEffect } = React;

// --- Options for dropdowns ---
const garmentStatusOptions = ["In Stock", "Not Ordered", "Ordered", "Part Received", "Booked in", "Delayed"];
const decorationMethodOptions = ["Embroidery", "DTF", "Both"];
const embroideryFileStatusOptions = ["On File", "Not Ordered", "Ordered", "Arrived", "Delayed", "Fixing"];
const dtfStatusOptions = ["In Stock", "Not Started", "On Press", "Printed", "Issues"];
const jobStatusOptions = ["Not Started", "Started", "On Hold", "Part Shipped", "Complete", "Sent"];

function OrderTracker() {
  // orders: all orders from the server
  const [orders, setOrders] = useState([]);
  // showModal: when new orders are found, show the modal popup
  const [showModal, setShowModal] = useState(false);
  // newOrdersForm: holds extra fields for each new order (keyed by SORD)
  const [newOrdersForm, setNewOrdersForm] = useState({});
  // expandedRows: object mapping SORD to true/false for whether the row is expanded
  const [expandedRows, setExpandedRows] = useState({});
  // completedItems: tracks which master codes have been checked off per order (used for the progress bar)
  const [completedItems, setCompletedItems] = useState({});
  // backOrderSelections: tracks which back order items (from "Other Parts") are selected per order
  const [backOrderSelections, setBackOrderSelections] = useState({});

  // --- Fetch orders from your API when the component loads ---
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/active-orders');
      const data = await res.json();
      setOrders(data);
      // Initialize completedItems and backOrderSelections for each order:
      const compItems = {};
      const backOrders = {};
      data.forEach(order => {
        // Create an array of booleans for each item in the order's Item List
        compItems[order.SORD] = order["Item List"].map(() => false);
        // Start with an empty array for back order selections
        backOrders[order.SORD] = [];
      });
      setCompletedItems(compItems);
      setBackOrderSelections(backOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // --- Handle CSV Upload ---
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target.result;
      try {
        const res = await fetch('/api/upload-orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/csv'
          },
          body: csvText
        });
        const updatedOrders = await res.json();
        setOrders(updatedOrders);
        // Identify any new orders (ones with isNew === true)
        const newOrders = updatedOrders.filter(order => order.isNew);
        if (newOrders.length > 0) {
          // Set up form data for these new orders
          const formData = {};
          newOrders.forEach(order => {
            formData[order.SORD] = {
              isNew: order.isNew,
              garmentStatus: order.garmentStatus || "",
              decorationMethod: order.decorationMethod || "",
              embroideryFileStatus: order.embroideryFileStatus || "",
              dtfStatus: order.dtfStatus || ""
            };
          });
          setNewOrdersForm(formData);
          setShowModal(true);
        }
        // Also update our completedItems and backOrderSelections for any new orders
        const compItems = { ...completedItems };
        const backOrders = { ...backOrderSelections };
        updatedOrders.forEach(order => {
          if (!compItems[order.SORD]) {
            compItems[order.SORD] = order["Item List"].map(() => false);
          }
          if (!backOrders[order.SORD]) {
            backOrders[order.SORD] = [];
          }
        });
        setCompletedItems(compItems);
        setBackOrderSelections(backOrders);
      } catch (error) {
        console.error("Error uploading CSV:", error);
      }
    };
    reader.readAsText(file);
  };

  // --- Handlers for the modal popup form (for new orders) ---
  const handleModalChange = (sord, field, value) => {
    setNewOrdersForm(prev => ({
      ...prev,
      [sord]: {
        ...prev[sord],
        [field]: value
      }
    }));
  };

  const handleModalSubmit = () => {
    // Update orders with the values from the modal form.
    const updatedOrders = orders.map(order => {
      if (newOrdersForm[order.SORD]) {
        return {
          ...order,
          isNew: newOrdersForm[order.SORD].isNew,
          garmentStatus: newOrdersForm[order.SORD].garmentStatus,
          decorationMethod: newOrdersForm[order.SORD].decorationMethod,
          embroideryFileStatus: newOrdersForm[order.SORD].embroideryFileStatus,
          dtfStatus: newOrdersForm[order.SORD].dtfStatus
        };
      }
      return order;
    });
    setOrders(updatedOrders);
    setShowModal(false);
  };

  // --- Toggle row expansion (to show additional job details) ---
  const toggleRowExpansion = (sord) => {
    setExpandedRows(prev => ({
      ...prev,
      [sord]: !prev[sord]
    }));
  };

  // --- Toggle a completed item (checkbox in the expanded row) ---
  const handleCompletedItemToggle = (sord, index) => {
    setCompletedItems(prev => {
      const updated = { ...prev };
      updated[sord][index] = !updated[sord][index];
      return updated;
    });
  };

  // --- Toggle back order items (from Other Parts) ---
  const handleBackOrderToggle = (sord, item) => {
    setBackOrderSelections(prev => {
      const selected = prev[sord] || [];
      if (selected.includes(item)) {
        // Remove the item if already selected
        return { ...prev, [sord]: selected.filter(x => x !== item) };
      } else {
        return { ...prev, [sord]: [...selected, item] };
      }
    });
  };

  // --- Handle changes to fields in the expanded row (e.g. garmentStatus, jobStatus) ---
  const handleFieldChange = (sord, field, value) => {
    setOrders(prev => prev.map(order => {
      if (order.SORD === sord) {
        return { ...order, [field]: value };
      }
      return order;
    }));
  };

  // --- Calculate progress percentage based on completed items ---
  const calculateProgress = (sord) => {
    const comp = completedItems[sord] || [];
    const total = comp.length;
    const completedCount = comp.filter(val => val).length;
    return total ? Math.round((completedCount / total) * 100) : 0;
  };

  return (
    <div className="order-tracker-container">
      <h2>Order Production Tracker</h2>
      
      {/* CSV Upload Section */}
      <div className="upload-section">
        <input type="file" accept=".csv" onChange={handleCSVUpload} />
      </div>

      {/* Orders Table */}
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
                <td>
                  {order.SORD} {order.isNew && <span className="new-tag">New</span>}
                </td>
                <td>{order["Trader Name"]}</td>
                <td>{order["Total Items"]}</td>
                <td>{order["Ordered Date"]}</td>
                <td>{order["Due Date"]}</td>
                <td>{order["Total Logos"]}</td>
                <td>
                  <select value={order.jobStatus} onChange={(e) => handleFieldChange(order.SORD, 'jobStatus', e.target.value)}>
                    {jobStatusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </td>
              </tr>
              {/* Expanded Row for Additional Details */}
              {expandedRows[order.SORD] && (
                <tr className="expanded-row">
                  <td colSpan="7">
                    <div className="expanded-content">
                      <div className="field-group">
                        <label>Garment Status:</label>
                        <select value={order.garmentStatus} onChange={(e) => handleFieldChange(order.SORD, 'garmentStatus', e.target.value)}>
                          <option value="">Select</option>
                          {garmentStatusOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      {(order.decorationMethod === "Embroidery" || order.decorationMethod === "Both") && (
                        <div className="field-group">
                          <label>Embroidery File Status:</label>
                          <select value={order.embroideryFileStatus} onChange={(e) => handleFieldChange(order.SORD, 'embroideryFileStatus', e.target.value)}>
                            <option value="">Select</option>
                            {embroideryFileStatusOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {(order.decorationMethod === "DTF" || order.decorationMethod === "Both") && (
                        <div className="field-group">
                          <label>DTF Status:</label>
                          <select value={order.dtfStatus} onChange={(e) => handleFieldChange(order.SORD, 'dtfStatus', e.target.value)}>
                            <option value="">Select</option>
                            {dtfStatusOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="field-group">
                        <label>Back Order Items:</label>
                        <div className="back-order-list">
                          {order["Item List"].map((item, index) => {
                            // For each item, list its Other Parts (if any)
                            return item["Other Parts"].map((otherPart, idx) => (
                              <div key={index + '-' + idx}>
                                <input 
                                  type="checkbox" 
                                  checked={(backOrderSelections[order.SORD] || []).includes(otherPart)}
                                  onChange={() => handleBackOrderToggle(order.SORD, otherPart)}
                                />
                                <span>{otherPart}</span>
                              </div>
                            ));
                          })}
                        </div>
                      </div>
                      <div className="field-group">
                        <label>Items Completed:</label>
                        <div className="completed-items-list">
                          {order["Item List"].map((item, index) => (
                            <div key={index}>
                              <input 
                                type="checkbox" 
                                checked={completedItems[order.SORD] ? completedItems[order.SORD][index] : false}
                                onChange={() => handleCompletedItemToggle(order.SORD, index)}
                              />
                              <span>{item["Master Code"]}</span>
                            </div>
                          ))}
                        </div>
                        <div className="progress-bar">
                          <div className="progress" style={{ width: `${calculateProgress(order.SORD)}%` }}></div>
                          <span>{calculateProgress(order.SORD)}%</span>
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

      {/* Modal Popup for New Orders */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>New Orders - Update Details</h3>
            {Object.keys(newOrdersForm).map(sord => (
              <div key={sord} className="modal-order-form">
                <h4>Order: {sord}</h4>
                <div className="field-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={newOrdersForm[sord].isNew} 
                      onChange={(e) => handleModalChange(sord, 'isNew', e.target.checked)}
                    />
                    New
                  </label>
                </div>
                <div className="field-group">
                  <label>Garment Status:</label>
                  <select 
                    value={newOrdersForm[sord].garmentStatus} 
                    onChange={(e) => handleModalChange(sord, 'garmentStatus', e.target.value)}
                  >
                    <option value="">Select</option>
                    {garmentStatusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label>Decoration Method:</label>
                  <select 
                    value={newOrdersForm[sord].decorationMethod} 
                    onChange={(e) => handleModalChange(sord, 'decorationMethod', e.target.value)}
                  >
                    <option value="">Select</option>
                    {decorationMethodOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                {(newOrdersForm[sord].decorationMethod === "Embroidery" || newOrdersForm[sord].decorationMethod === "Both") && (
                  <div className="field-group">
                    <label>Embroidery File Status:</label>
                    <select 
                      value={newOrdersForm[sord].embroideryFileStatus} 
                      onChange={(e) => handleModalChange(sord, 'embroideryFileStatus', e.target.value)}
                    >
                      <option value="">Select</option>
                      {embroideryFileStatusOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(newOrdersForm[sord].decorationMethod === "DTF" || newOrdersForm[sord].decorationMethod === "Both") && (
                  <div className="field-group">
                    <label>DTF Status:</label>
                    <select 
                      value={newOrdersForm[sord].dtfStatus} 
                      onChange={(e) => handleModalChange(sord, 'dtfStatus', e.target.value)}
                    >
                      <option value="">Select</option>
                      {dtfStatusOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
            <button onClick={handleModalSubmit}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Make OrderTracker globally accessible
window.OrderTracker = OrderTracker;
