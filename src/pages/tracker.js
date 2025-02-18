// src/pages/tracker.js
// import ReactDOM from 'react-dom/client';

// --- Import Components from their new folders ---
import Sidebar from './components/Sidebar/Sidebar.js';
import SearchBar from './components/SearchBar/SearchBar.js';
import OrderTable from './components/OrderTable/OrderTable.js';
import SummaryCards from './components/SummaryCards/SummaryCards.js';


// --- Main App Component (Now passes searchTerm directly in useEffect) ---
function App() {
    const [orders, setOrders] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState(''); // State for search term
    const [appStateReady, setAppStateReady] = React.useState(false); // NEW state to track appState readiness


    React.useEffect(() => {
        // --- Initialize window.appState and set appStateReady to true AFTER initialization ---
        window.appState = { // Simplified window.appState
            orders: orders,
            setOrders: setOrders,
            searchTerm: searchTerm,
            setSearchTerm: setSearchTerm,
            fetchOrderData: fetchOrderData,
            handleFileUpload: handleFileUpload,
            handleSearchChange: handleSearchChange,
            handleClearSearch: handleClearSearch
        };
        console.log("window.appState initialized in useEffect (initial):", window.appState); // Log after initialization
        setAppStateReady(true); // Set appStateReady to true when appState is ready

        fetchOrderData(); // Fetch initial data
    }, []); // Empty dependency array - run only once on mount


    React.useEffect(() => { // NEW useEffect to render child components AFTER appStateReady and on 'orders' state change
        if (appStateReady) {
            console.log("appStateReady is true OR orders state updated, re-rendering child components..."); // Log before rendering children

            // --- UPDATE window.appState HERE, to ensure it's synced with the latest 'orders' state ---
            window.appState = { // Update window.appState to reflect latest 'orders'
                ...window.appState, // Keep existing appState properties
                orders: orders // Update 'orders' with the latest state
            };
            console.log("window.appState updated in useEffect (orders change):", window.appState); // Log after update


            renderChildComponents(searchTerm); // Pass searchTerm as argument to renderChildComponents
        }
    }, [orders, appStateReady]); // Dependency on 'orders' and 'appStateReady' - re-run when 'orders' changes or on initial app ready


    React.useEffect(() => { // NEW useEffect to render child components AFTER appStateReady (INITIAL RENDER ONLY)
        if (appStateReady) {
            console.log("appStateReady is true, rendering child components... (initial render)"); // Log before rendering children (initial)
            renderChildComponents(searchTerm); // Pass searchTerm as argument to renderChildComponents (initially empty)
        }
    }, [appStateReady]); // Dependency on appStateReady - run when it becomes true (for initial render)



    async function fetchOrderData() { // Keep fetchOrderData as a function in App
        try {
            const response = await fetch('/api/active-orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Order data fetched in App component:', data);
            setOrders(data); // <-- This updates the 'orders' state, triggering the 2nd useEffect
        } catch (error) {
            console.error('Error fetching order data in App component:', error);
            alert('Failed to load order data in React component.');
        }
    }

    function handleFileUpload(newOrders) { // Keep handleFileUpload in App
        setOrders(newOrders);
        fetchOrderData();
    }

    function handleSearchChange(newSearchTerm) { // Keep handleSearchChange in App
        setSearchTerm(newSearchTerm);
    }

    function handleClearSearch() { // Keep handleClearSearch in App
        setSearchTerm('');
    }


    function renderChildComponents(currentSearchTerm) { // Function to RENDER or UPDATE child components - NOW ACCEPTS searchTerm ARGUMENT
        // --- CORRECT WAY: Use root.render() on EXISTING roots to UPDATE content ---
        sidebarRoot.render(React.createElement(Sidebar, { onFileUpload: window.appState.handleFileUpload })); // Use root.render()

        searchBarRoot.render(React.createElement(SearchBar, {
            searchTerm: currentSearchTerm, // Pass currentSearchTerm directly as prop
            onSearchChange: window.appState.handleSearchChange,
            onClearSearch: window.appState.handleClearSearch
        }));

        summaryCardsRoot.render(React.createElement(SummaryCards, { orders: window.appState.orders })); // Use root.render()

        orderTableRoot.render(React.createElement(OrderTable, { orders: window.appState.orders, searchTerm: currentSearchTerm })); // Pass currentSearchTerm directly as prop
    }


    return null; // App component itself doesn't render anything visible directly now
}

// --- Create ReactDOM Roots ONCE, OUTSIDE App Component ---
const appRoot = ReactDOM.createRoot(document.getElementById('app-root')); // Mount App to app-root
const sidebarRoot = ReactDOM.createRoot(document.getElementById('sidebar-root')); // Create root for Sidebar ONCE
const searchBarRoot = ReactDOM.createRoot(document.getElementById('search-bar-root')); // Create root for SearchBar ONCE
const summaryCardsRoot = ReactDOM.createRoot(document.getElementById('summary-cards')); // Create root for SummaryCards ONCE
const orderTableRoot = ReactDOM.createRoot(document.getElementById('order-table-root')); // Create root for OrderTable ONCE


// --- Render the App Component (for state and window.appState initialization) ---
appRoot.render(React.createElement(App));

// --- Initial rendering of child components will be triggered by useEffect in App component ---
// --- renderChildComponents() function will be called by useEffect for initial and subsequent renders ---