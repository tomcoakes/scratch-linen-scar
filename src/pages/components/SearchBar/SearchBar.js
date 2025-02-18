// src/pages/components/SearchBar/SearchBar.js
//import React from 'react'; // No need to import React here anymore with CDN
//import styles from './SearchBar.module.css'; // If you create SearchBar.module.css

// --- SearchBar Component (React) ---
function SearchBar({ searchTerm, onSearchChange, onClearSearch }) {
    const handleInputChange = (event) => {
        onSearchChange(event.target.value);
    };

    const handleClearClick = () => {
        onClearSearch(''); // Clear search term in parent component
    };

    return (
        React.createElement('div', { className: "table-controls" },
            React.createElement('div', { className: "search-input-container" },
                React.createElement('input', {
                    type: "text",
                    id: "search-input",
                    placeholder: "Search Orders...",
                    value: searchTerm,
                    onChange: handleInputChange
                }),
                React.createElement('button', {
                    type: "button",
                    id: "clear-search-button",
                    className: "clear-search-button",
                    style: { display: searchTerm ? 'inline-block' : 'none' },
                    onClick: handleClearClick
                }, '×')
            )
        )
    );
}

export default SearchBar; // Export the component