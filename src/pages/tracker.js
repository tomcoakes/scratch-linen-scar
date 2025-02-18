// src/pages/tracker.js

// --- Import React ---
import React from 'react';
import ReactDOM from 'react-dom/client';

// --- Main App Component ---
function App() {
    return (
        <div>
            <h1>Hello React Tracker!</h1> 
            {/* We'll put our order table component here soon */}
        </div>
    );
}

// --- Render the App ---
const root = ReactDOM.createRoot(document.getElementById('order-table-root')); // Target the div in tracker.html
root.render(<App />);