// src/pages/components/NewOrderPopup/NewOrderPopup.js

function NewOrderPopup({ newOrders, onOrderUpdates, onClose }) {
    if (!newOrders || newOrders.length === 0) {
        return null; // Don't render anything if no new orders
    }

    const [updatedOrders, setUpdatedOrders] = React.useState([...newOrders]); // Start with a copy of newOrders

    const handleInputChange = (sord, field, value) => {
        const newUpdatedOrders = updatedOrders.map(order => {
            if (order.SORD === sord) {
                return { ...order, [field]: value };
            }
            return order;
        });
        setUpdatedOrders(newUpdatedOrders);
    };

    const handleCheckboxChange = (sord, field, checked) => {
      const newUpdatedOrders = updatedOrders.map(order => {
          if (order.SORD === sord) {
              return { ...order, [field]: checked }; // Directly use 'checked' value
          }
          return order;
      });
      setUpdatedOrders(newUpdatedOrders);
    };


    const handleSubmit = () => {
        onOrderUpdates(updatedOrders); // Pass updated orders back to App component
        onClose(); // Close the popup
    };

    return (
        React.createElement('div', { className: "popup-overlay" },
            React.createElement('div', { className: "popup-content" },
                React.createElement('h2', null, 'New Orders'),
                React.createElement('table', null,
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', null, 'SORD'),
                            React.createElement('th', null, 'Ordered Date'),
                            React.createElement('th', null, 'New/Repeat'),
                            React.createElement('th', null, 'Garment Status'),
                            React.createElement('th', null, 'Decoration Method'),
                            React.createElement('th', null, 'Embroidery Status'), // Conditionally shown
                            React.createElement('th', null, 'DTF Status')      // Conditionally shown
                        )
                    ),
                    React.createElement('tbody', null,
                        updatedOrders.map(order => (
                            React.createElement('tr', { key: order.SORD },
                                React.createElement('td', null, order.SORD),
                                React.createElement('td', null, order["Ordered Date"]),
                                React.createElement('td', null,
                                    React.createElement('input', {
                                        type: "checkbox",
                                        checked: order.isNew, // Now, if order.isNew is true, the checkbox is checked.
                                        onChange: (e) => handleCheckboxChange(order.SORD, 'isNew', e.target.checked)
                                      })
                                ),
                                React.createElement('td', null,
                                    React.createElement('select', {
                                        value: order.garmentStatus,
                                        onChange: (e) => handleInputChange(order.SORD, 'garmentStatus', e.target.value)
                                    },
                                        React.createElement('option', { value: "Not Started" }, "Not Started"),
                                        React.createElement('option', { value: "Not Ordered" }, "Not Ordered"),
                                        React.createElement('option', { value: "Ordered" }, "Ordered"),
                                        React.createElement('option', { value: "Part Received" }, "Part Received"),
                                        React.createElement('option', { value: "Booked in" }, "Booked in"),
                                        React.createElement('option', { value: "Delayed" }, "Delayed"),
                                        React.createElement('option', { value: "In Stock" }, "In Stock") // Corrected 'In Stock' option
                                    )
                                ),
                                React.createElement('td', null,
                                    React.createElement('select', {
                                        value: order.decorationMethod,
                                        onChange: (e) => handleInputChange(order.SORD, 'decorationMethod', e.target.value)
                                    },
                                        React.createElement('option', { value: "" }, "Select..."),
                                        React.createElement('option', { value: "Embroidery" }, "Embroidery"),
                                        React.createElement('option', { value: "DTF" }, "DTF"),
                                        React.createElement('option', { value: "Both" }, "Both")
                                    )
                                ),
                                order.decorationMethod === 'Embroidery' || order.decorationMethod === 'Both' ? (
                                    React.createElement('td', null,
                                        React.createElement('select', {
                                            value: order.embroideryFileStatus,
                                            onChange: (e) => handleInputChange(order.SORD, 'embroideryFileStatus', e.target.value)
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
                                ) : React.createElement('td', null), // Empty cell if not Embroidery or Both
                                order.decorationMethod === 'DTF' || order.decorationMethod === 'Both' ? (
                                    React.createElement('td', null,
                                        React.createElement('select', {
                                            value: order.dtfStatus,
                                            onChange: (e) => handleInputChange(order.SORD, 'dtfStatus', e.target.value)
                                        },
                                            React.createElement('option', { value: "" }, "Select..."),
                                            React.createElement('option', { value: "In Stock" }, "In Stock"),
                                            React.createElement('option', { value: "Not Started" }, "Not Started"),
                                            React.createElement('option', { value: "On Press" }, "On Press"),
                                            React.createElement('option', { value: "Printed" }, "Printed"),
                                            React.createElement('option', { value: "Issues" }, "Issues")
                                        )
                                    )
                                ) : React.createElement('td', null) // Empty cell if not DTF or Both
                            )
                        ))
                    )
                ),
                React.createElement('button', { onClick: handleSubmit, className: "submit-button" }, 'Submit')
            )
        )
    );
}

export default NewOrderPopup;