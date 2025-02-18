// src/pages/tracker.js
// import ReactDOM from 'react-dom/client';

// --- Import Components from their new folders ---
import Sidebar from './components/Sidebar/Sidebar.js';
import SearchBar from './components/SearchBar/SearchBar.js';
import OrderTable from './components/OrderTable/OrderTable.js';
import SummaryCards from './components/SummaryCards/SummaryCards.js';


// --- Main App Component ---
function App() {
    const [orders, setOrders] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState(''); // State for search term

    React.useEffect(() => {
        fetchOrderData();
    }, []);

    const fetchOrderData = async () => {
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
    };

    const handleFileUpload = (newOrders) => {
        setOrders(newOrders); // Update orders state when new CSV is uploaded
        fetchOrderData(); // Re-fetch to ensure data is up-to-date from server - maybe not needed here as upload already returns data?
    };

    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm(''); // Clear search term
    };


    return (
        React.createElement('div', null,
            React.createElement(Sidebar, { onFileUpload: handleFileUpload }),
            React.createElement(SearchBar, {
                searchTerm: searchTerm,
                onSearchChange: handleSearchChange,
                onClearSearch: handleClearSearch
            }),
            React.createElement(SummaryCards, { orders: orders }),
            React.createElement(OrderTable, { orders: orders, searchTerm: searchTerm }),
        )
    );
}

// --- Render the App ---
const root = ReactDOM.createRoot(document.getElementById('order-table-root'));
root.render(React.createElement(App));