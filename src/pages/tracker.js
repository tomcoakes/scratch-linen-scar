// src/pages/tracker.js
import React, { useState, useEffect } from 'react'; // Import React, useState, and useEffect
import ReactDOM from 'react-dom/client';

function TrackerApp() {

    return (
        <h1>Order Tracker (React!)</h1>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TrackerApp />);