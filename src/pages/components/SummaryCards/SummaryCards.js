// src/pages/components/SummaryCards/SummaryCards.js
//import React from 'react'; // No need to import React here anymore with CDN
//import styles from './SummaryCards.module.css'; // If you create SummaryCards.module.css

// --- SummaryCards Component (React) ---
function SummaryCards({ orders }) {
    const totalJobs = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + (parseInt(order['Total Items'], 10) || 0), 0);
    const totalLogos = orders.reduce((total, order) => total + (parseInt(order['Total Logos'], 10) || 0), 0);

    return (
        React.createElement('div', { className: "summary-cards", id: "summary-cards" },
            React.createElement('div', { className: "card" },
                React.createElement('h3', null, 'Total Jobs'),
                React.createElement('p', null, totalJobs)
            ),
            React.createElement('div', { className: "card" },
                React.createElement('h3', null, 'Total Items'),
                React.createElement('p', null, totalItems)
            ),
            React.createElement('div', { className: "card" },
                React.createElement('h3', null, 'Total Logos'),
                React.createElement('p', null, totalLogos)
            )
        )
    );
}

export default SummaryCards; // Export the component