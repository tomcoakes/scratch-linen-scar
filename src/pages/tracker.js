// src/pages/tracker.js

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Sidebar from './components/Sidebar';        // Import the Sidebar component
import OrderTable from './components/OrderTable'; // Import the OrderTable component


function App() {
    const [orders, setOrders] = useState([]); // State to hold order data

    // --- Fetch order data on component mount ---
    useEffect(() => {
        fetchOrderData();
    }, []); // Empty dependency array means this runs *once* on mount


    async function fetchOrderData() {
        try {
            const response = await fetch('/api/active-orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Order data fetched:', data);
            setOrders(data); // Update the 'orders' state with the fetched data
        } catch (error) {
            console.error('Error fetching order data:', error);
            alert('Failed to load order data.');
        }
    }

      // --- (Rest of your event handler functions: handleDragOver, handleFileDrop, handleFile, etc.) ---
      // ---  They should be placed *outside* the App component ---
      // ... (All your existing functions like handleFile, parseCSVData (but don't parse!), fetchOrderData, etc.)

    return (
        <>
            <header>
                <div className="header-container">
                    <h1>Order Production Tracker</h1>
                    <nav>
                        <ul className="nav-links">
                            <li><a href="index.html">Home</a></li>
                            <li><a href="threads.html">Thread Manager</a></li>
                            <li><a href="proof_creator.html">Proof Creator</a></li>
                            <li><a href="tracker.html" className="active">Order Tracker</a></li>
                        </ul>
                    </nav>
                </div>
            </header>

            <main className="main-container-tracker">
                <Sidebar /> 
                <div className="content">
                    <div className="summary-cards" id="summary-cards">
                      
                    </div>
                    <OrderTable orders={orders} /> 
                </div>
            </main>

            <footer>
                <p>© 2025 Colour Matcher</p>
            </footer>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);