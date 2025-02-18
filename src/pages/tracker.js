// src/pages/tracker.js

// --- Import React with explicit CDN paths and NAMED imports (WORKAROUND) ---
import * as React from 'https://unpkg.com/react@18/umd/react.development.js';
import * as ReactDOM from 'https://unpkg.com/react-dom@18/umd/react-dom.development.js';

// --- Main App Component ---
function App() {
    return (
        React.createElement('div', null, // <-- Correct React.createElement syntax
            React.createElement('h1', null, 'Hello React Tracker!') // <-- Correct React.createElement syntax
        )
    );
}

// --- Render the App ---
const root = ReactDOM.createRoot(document.getElementById('order-table-root')); // Target the div in tracker.html
root.render(React.createElement(App)); // <-- NO CHANGE HERE (this line was already correct)

// --- MODIFY THIS LINE BELOW - Access createRoot using bracket notation: ---
ReactDOM["createRoot"](document.getElementById('order-table-root')).render(React.createElement(App)); 