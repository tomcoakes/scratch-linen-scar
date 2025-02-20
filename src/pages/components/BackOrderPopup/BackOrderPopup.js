// src/pages/components/BackOrderPopup/BackOrderPopup.js
import React from 'react';
import styles from './BackOrderPopup.module.css'; // Import CSS module

function BackOrderPopup({ order, onClose, onSubmit }) { // Receive order, onClose, onSubmit props

    // --- Placeholder data for now (replace with actual order data later) ---
    const otherPartsDetails = order["Item List"] && order["Item List"].length > 0 ? order["Item List"][0]["Other Parts Details"] : [];


    return (
        React.createElement('div', { className: "popupOverlay" },
            React.createElement('div', { className: "popupContent" },
                React.createElement('h2', null, "Add Back Order Items"),
                React.createElement('table', { className: "backOrderTable" }, // Apply CSS module class
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', null, "Part Code"),
                            React.createElement('th', null, "Description"),
                            React.createElement('th', null, "Back Order Qty")
                        )
                    ),
                    React.createElement('tbody', null,
                        otherPartsDetails.map((partDetail, index) => (
                            React.createElement('tr', { key: index },
                                React.createElement('td', null, partDetail.partCode || "N/A"),
                                React.createElement('td', null, partDetail.description || "N/A"),
                                React.createElement('td', null,
                                    React.createElement('input', {
                                        type: "number",
                                        min: "0",
                                        defaultValue: partDetail.backOrderQty // Default value from JSON
                                        // We'll add onChange handler in the next step
                                    })
                                )
                            )
                        ))
                    )
                ),
                React.createElement('div', {className: "buttonsContainer"},
                    React.createElement('button', { onClick: onSubmit, className: "submitButton" }, "Submit"), // ADD Submit button
                    React.createElement('button', { onClick: onClose, className: "closeButton" }, "Close Popup") // Keep Close button
                )
            )
        )
    );
}

export default BackOrderPopup;