// src/pages/tracker.js
// import ReactDOM from 'react-dom/client';

// --- Import Components from their new folders ---
import Sidebar from './components/Sidebar/Sidebar.js';
import SearchBar from './components/SearchBar/SearchBar.js';
import OrderTable from './components/OrderTable/OrderTable.js';
import SummaryCards from './components/SummaryCards/SummaryCards.js';


// --- Main App Component (Now mainly for state management and initialization) ---
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
        console.log("window.appState initialized in useEffect:", window.appState); // Log after initialization
        setAppStateReady(true); // Set appStateReady to true when appState is ready

        fetchOrderData(); // Fetch initial data
    }, []); // Empty dependency array - run only once on mount


    React.useEffect(() => { // NEW useEffect to render child components AFTER appStateReady
        if (appStateReady) {
            console.log("appStateReady is true, rendering child components..."); // Log before rendering children
            renderChildComponents(); // Call function to render child components
        }
    }, [appStateReady]); // Dependency on appStateReady - run when it becomes true


    async function fetchOrderData() { // Keep fetchOrderData as a function in App
        try {
            const response = await fetch('/api/active-orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Order data fetched in App component:', data);
            setOrders(data);
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


    function renderChildComponents() { // Function to render child components
        // Render Sidebar into sidebar-root
        const sidebarRoot = ReactDOM.createRoot(document.getElementById('sidebar-root'));
        sidebarRoot.render(React.createElement(Sidebar, { onFileUpload: window.appState.handleFileUpload })); // Access from window

        // Render SearchBar into search-bar-root
        const searchBarRoot = ReactDOM.createRoot(document.getElementById('search-bar-root'));
        searchBarRoot.render(React.createElement(SearchBar, {
            searchTerm: window.appState.searchTerm, // Access from window
            onSearchChange: window.appState.handleSearchChange, // Access from window
            onClearSearch: window.appState.handleClearSearch // Access from window
        }));

        // Render SummaryCards into summary-cards
        const summaryCardsRoot = ReactDOM.createRoot(document.getElementById('summary-cards'));
        summaryCardsRoot.render(React.createElement(SummaryCards, { orders: window.appState.orders })); // Access from window

        // Render OrderTable into order-table-root
        const orderTableRoot = ReactDOM.createRoot(document.getElementById('order-table-root'));
        orderTableRoot.render(React.createElement(OrderTable, { orders: window.appState.orders, searchTerm: window.appState.searchTerm })); // Access from window
    }


    return null; // App component itself doesn't render anything visible directly now
}

// --- Render the App Component (for state and window.appState initialization) ---
const appRoot = ReactDOM.createRoot(document.getElementById('app-root')); // Mount App to app-root
appRoot.render(React.createElement(App));


// --- Child components are now rendered by renderChildComponents() inside useEffect ---
// --- REMOVE ReactDOM.render calls for child components from here ---