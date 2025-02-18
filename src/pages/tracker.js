// src/pages/tracker.js

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client'; // CORRECT IMPORT

function App() {
  return (
    <>
        <header>
            <div class="header-container">
                <h1>Order Production Tracker</h1>
                <nav>
                    <ul class="nav-links">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="threads.html">Thread Manager</a></li>
                        <li><a href="proof_creator.html">Proof Creator</a></li>
                         <li><a href="tracker.html" class="active">Order Tracker</a></li>
                    </ul>
                </nav>
            </div>
        </header>
      <h1>Hello from React!</h1>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);