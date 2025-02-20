// src/pages/components/BackOrderPopup/BackOrderPopup.js

// import styles from './BackOrderPopup.module.css'; // Import CSS module

function BackOrderPopup({ order, onClose, onSubmit }) { // We'll pass props later

    return (
        React.createElement('div', { className: "popupOverlay" },
            React.createElement('div', { className: "popupContent" },
                React.createElement('h2', null, "Add Back Order Items"),
                React.createElement('p', null, "This is the Back Order Popup content."), // Placeholder content
                React.createElement('button', { onClick: onClose }, "Close Popup") // Basic close button
            )
        )
    );
}

export default BackOrderPopup;