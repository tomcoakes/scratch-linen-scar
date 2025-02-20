// src/pages/components/BackOrderPopup/BackOrderPopup.js
// import React from 'react';
// import styles from './BackOrderPopup.module.css';

function BackOrderPopup({ order, onClose, onSubmit }) {

    // --- Consolidate Other Parts Details from all items in the order ---
    const allOtherPartsDetails = order["Item List"].reduce((acc, item) => {
        if (item["Other Parts Details"] && Array.isArray(item["Other Parts Details"])) {
            item["Other Parts Details"].forEach(partDetail => {
                // Calculate total quantity for this Other Part (qty * order qty of master item)
                const totalQuantity = partDetail.partCode ? parseInt(item["Ordered Qty"], 10) : 0; // Only count if partCode exists
                if (totalQuantity > 0 && partDetail.partCode) { // Only add if quantity > 0 and partCode exists
                    acc.push({ ...partDetail, totalQuantity }); // Add totalQuantity to partDetail
                }
            });
        }
        return acc;
    }, []);


    return (
        React.createElement('div', { className: "popupOverlay" },
            React.createElement('div', { className: "popupContent" },
                React.createElement('h2', null, "Add Back Order Items"),
                React.createElement('table', { className: "backOrderTable" },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', null, "Part Code"),
                            React.createElement('th', null, "Description"),
                            React.createElement('th', null, "Total Qty Needed"), // Updated header
                            React.createElement('th', null, "Back Order Qty")
                        )
                    ),
                    React.createElement('tbody', null,
                        allOtherPartsDetails.map((partDetail, index) => ( // Use allOtherPartsDetails
                            React.createElement('tr', { key: index },
                                React.createElement('td', null, partDetail.partCode || "N/A"),
                                React.createElement('td', null, partDetail.description || "N/A"),
                                React.createElement('td', null, partDetail.totalQuantity), // Display totalQuantity
                                React.createElement('td', null,
                                    React.createElement('input', {
                                        type: "number",
                                        min: "0",
                                        defaultValue: partDetail.backOrderQty, // Default value from JSON
                                        // We'll add onChange handler in the next step
                                    })
                                )
                            )
                        ))
                    )
                ),
                React.createElement('div', {className: "buttonsContainer"},
                    React.createElement('button', { onClick: onSubmit, className: "submitButton" }, "Submit"),
                    React.createElement('button', { onClick: onClose, className: "closeButton" }, "Close Popup")
                )
            )
        )
    );
}

export default BackOrderPopup;