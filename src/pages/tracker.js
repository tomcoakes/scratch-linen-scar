
// src/pages/tracker.js
// import ReactDOM from 'react-dom/client';

// --- Import Components from their new folders ---
// REMOVED - import Sidebar from './components/Sidebar/Sidebar.js';
import SearchBar from './components/SearchBar/SearchBar.js';
import OrderTable from './components/OrderTable/OrderTable.jsx';
import SummaryCards from './components/SummaryCards/SummaryCards.js';
import NewOrderPopup from './components/NewOrderPopup/NewOrderPopup.js'; // Import the popup component
 

// --- Main App Component (Now includes popup handling and item completion handling) ---
function App() {
    const [orders, setOrders] = React.useState([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [appStateReady, setAppStateReady] = React.useState(false);
    const [showNewOrderPopup, setShowNewOrderPopup] = React.useState(false);
    const [newOrders, setNewOrders] = React.useState([]);
    const [isDragOver, setIsDragOver] = React.useState(false); // ADDED - Drag Over State

    React.useEffect(() => {
        // --- Initialize window.appState and set appStateReady to true AFTER initialization ---
        window.appState = {
            orders: orders,
            setOrders: setOrders,
            searchTerm: searchTerm,
            setSearchTerm: setSearchTerm,
            fetchOrderData: fetchOrderData,
            handleFileUpload: handleFileUpload,
            handleSearchChange: handleSearchChange,
            handleClearSearch: handleClearSearch,
            handleOrderUpdates: handleOrderUpdates,
            handleItemCompletionChange: handleItemCompletionChange, // Add to appState
        };
        console.log("window.appState initialized in useEffect (initial):", window.appState);
        setAppStateReady(true);

        fetchOrderData();
    }, []);

    React.useEffect(() => {
        if (appStateReady) {
            console.log("appStateReady is true OR orders/searchTerm state updated, re-rendering child components...");
            window.appState = {
                ...window.appState,  // Keep existing properties
                orders: orders,    // Update 'orders'
                searchTerm: searchTerm, // and 'searchTerm'
            };
            console.log("window.appState updated in useEffect (orders/searchTerm change):", window.appState);

            renderChildComponents(searchTerm);
        }
    }, [orders, searchTerm, appStateReady]);

    React.useEffect(() => {
        if (appStateReady) {
            console.log("appStateReady is true, rendering child components... (initial render)");
            renderChildComponents(searchTerm);
        }
    }, [appStateReady, searchTerm]);

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


const handleFileUpload = (newOrdersFromServer) => { // Modified to handle new orders from server
      // No longer necessary to update 'orders' state directly here
      // The fetchOrderData will update 'orders' after the server responds

      // Identify new orders based on isNew flag
      const trulyNewOrders = newOrdersFromServer.filter(order => order.isNew);

      // Show the popup only if there are new orders
      if (trulyNewOrders.length > 0) {
          setNewOrders(trulyNewOrders); // Set new orders to be displayed in the popup
          setShowNewOrderPopup(true);     // Show the popup
      }

      fetchOrderData(); // Re-fetch to get the updated data (including new orders) from the server
  };

    const handleOrderUpdates = async (updatedOrders) => {
        // Send updated orders to server using PUT request
        console.log("updatedOrders going to the server", updatedOrders)

        for (const updatedOrder of updatedOrders) {
          try {
              const response = await fetch(`/api/update-order/${updatedOrder.SORD}`, { // ADD A NEW ENDPOINT ON SERVER
                  method: 'PUT',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(updatedOrder),
              });

              if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Server error: ${response.status} - ${errorText}`);
              }
          } catch (error) {
              console.error('Error updating order:', error);
              alert(`Error updating order: ${error.message}`);
              // IMPORTANT: Consider how to handle errors.  Maybe revert changes in the UI?
              return; // Exit the loop on error.  Or handle each error individually.
          }
        }
        fetchOrderData()
        // alert('Orders updated successfully!'); // Provide feedback to the user
    };

    const handleSearchChange = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    // --- NEW: Function to handle item completion changes ---
    const handleItemCompletionChange = async (sord, updatedOrder) => {
        // 1. Update the local 'orders' state
        setOrders(prevOrders => {
            const updatedOrders = prevOrders.map(order => {
                if (order.SORD === sord) {
                    return updatedOrder; // Replace the entire order with the updated one
                }
                return order;
            });
            return updatedOrders;
        });

        // 2. Send PUT request to server to update JSON data
        try {
            const response = await fetch(`/api/update-order/${sord}`, { // Use the correct endpoint
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedOrder), // Send the *entire* updated order
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json(); // Parse response JSON
            console.log('Server response (order update):', responseData);


        } catch (error) {
            console.error('Error updating order:', error);
            alert(`Error updating order: ${error.message}`);
            // TODO: Consider reverting UI changes on error, or showing an error message.
        }
    };


    function renderChildComponents(currentSearchTerm) {
        // REMOVED sidebarRoot.render(React.createElement(Sidebar, { onFileUpload: window.appState.handleFileUpload })); // REMOVE THIS LINE

        searchBarRoot.render(React.createElement(SearchBar, {
            searchTerm: currentSearchTerm,
            onSearchChange: window.appState.handleSearchChange,
            onClearSearch: window.appState.handleClearSearch
        }));

        summaryCardsRoot.render(React.createElement(SummaryCards, {
          orders: window.appState.orders,
          onFileUpload: window.appState.handleFileUpload, // Pass the file upload handler
          isDragOver: isDragOver,                     // Pass drag state
          setIsDragOver: setIsDragOver                // Pass state setter
        }));

        // --- Pass onItemCompletionChange prop to OrderTable ---
        orderTableRoot.render(React.createElement(OrderTable, {
            orders: window.appState.orders,
            searchTerm: currentSearchTerm,
            onItemCompletionChange: window.appState.handleItemCompletionChange // Pass the callback prop
        }));
    }

    return (
        // Conditionally render the popup
        showNewOrderPopup ? React.createElement(NewOrderPopup, {
            newOrders: newOrders,
            onOrderUpdates: handleOrderUpdates,
            onClose: () => setShowNewOrderPopup(false)
        }) : null
    );

}

const appRoot = ReactDOM.createRoot(document.getElementById('app-root'));
// REMOVED const sidebarRoot = ReactDOM.createRoot(document.getElementById('sidebar-root')); // REMOVE THIS LINE
const searchBarRoot = ReactDOM.createRoot(document.getElementById('search-bar-root'));
const summaryCardsRoot = ReactDOM.createRoot(document.getElementById('summary-cards'));
const orderTableRoot = ReactDOM.createRoot(document.getElementById('order-table-root'));

appRoot.render(React.createElement(App));