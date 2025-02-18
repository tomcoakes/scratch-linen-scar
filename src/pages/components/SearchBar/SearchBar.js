// src/pages/components/SearchBar/SearchBar.js

// --- SearchBar Component (React) ---
function SearchBar({ searchTerm, onSearchChange, onClearSearch }) {
  console.log("SearchBar - Received searchTerm prop:", searchTerm); 
    const handleInputChange = (event) => {
      console.log("SearchBar - handleInputChange - event.target.value:", event.target.value);
        onSearchChange(event.target.value);
    };

    const handleClearClick = () => {
        onClearSearch(''); // Clear search term in parent component
    };

    return (
        React.createElement('div', { className: "search-bar" }, // Changed className to "search-bar"
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