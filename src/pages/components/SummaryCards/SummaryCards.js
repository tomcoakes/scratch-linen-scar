// src/pages/components/SummaryCards/SummaryCards.js

import Sidebar from '../Sidebar/Sidebar.js'; // Import Sidebar

function SummaryCards({ orders, onFileUpload }) { // Receive onFileUpload prop
    const totalJobs = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + (parseInt(order['Total Items'], 10) || 0), 0);
    const totalLogos = orders.reduce((total, order) => total + (parseInt(order['Total Logos'], 10) || 0), 0);

    return (
        React.createElement('div', { className: "summary-cards-container" },
            React.createElement(Sidebar, { onFileUpload: onFileUpload }), // Include Sidebar and pass prop
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

export default SummaryCards;