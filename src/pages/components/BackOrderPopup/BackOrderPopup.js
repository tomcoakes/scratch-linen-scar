// src/pages/components/BackOrderPopup/BackOrderPopup.js
// import React from 'react';
// import styles from './BackOrderPopup.module.css';

// --- ADD handleBackOrderQtyInputChange PROP HERE ---
function BackOrderPopup({ order, onClose, onSubmit, handleBackOrderQtyInputChange }) { 

    // --- Placeholder data for now (replace with actual order data later) ---
    const otherPartsDetails = order["Item List"] && order["Item List"].length > 0 ? order["Item List"][0]["Other Parts Details"] : [];

    return (
        React.createElement('div', { className: "popupOverlay" },
            React.createElement('div', { className: "popupContent" },
                React.createElement('h2', null, "Add Back Order Items"),
                React.createElement('table', { className: "backOrderTable" },
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            React.createElement('th', null, "Part Code"),
                            React.createElement('th', null, "Description"),
                            React.createElement('th', null, "Total Qty Needed"),
                            React.createElement('th', null, "Back Order Qty")
                        )
                    ),
                    React.createElement('tbody', null,
                        otherPartsDetails.map((partDetail, index) => (
                            React.createElement('tr', { key: index },
                                React.createElement('td', null, partDetail.partCode || "N/A"),
                                React.createElement('td', null, partDetail.description || "N/A"),
                                React.createElement('td', null, partDetail.totalQuantity),
                                React.createElement('td', null,
                                    React.createElement('input', {
                                        type: "number",
                                        min: "0",
                                        defaultValue: partDetail.backOrderQty,
                                        // --- ADD onChange HANDLER HERE - USE PROP ---
                                        onChange: (e) => handleBackOrderQtyInputChange(order.SORD, partDetail.partCode, e.target.value)
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