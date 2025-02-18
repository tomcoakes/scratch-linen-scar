// src/pages/components/OrderTable.jsx
import React from 'react';

function OrderTable({ orders }) { // Receives 'orders' as a prop
    return (
      <div className="table-container">
      <div class="table-controls">
              <div class="search-input-container">
                <input type="text" id="search-input" placeholder="Search Customers..." />
                <button type="button" id="clear-search-button" class="clear-search-button" style="display:none;">×</button>
              </div>
            </div>
        <table id="orders-table">
          <thead>
            <tr>
              <th data-sort="SORD" className="sortable">SORD <span className="sort-indicator"></span></th>
              <th data-sort="Trader Code" className="sortable">Trader Code <span className="sort-indicator"></span></th>
              <th data-sort="Trader Name" className="sortable">Trader Name <span className="sort-indicator"></span></th>
              <th data-sort="Total Items" className="sortable">Total Items <span className="sort-indicator"></span></th>
              <th data-sort="Ordered Date" className="sortable">Ordered Date <span className="sort-indicator"></span></th>
              <th data-sort="Due Date" className="sortable">Due Date <span className="sort-indicator"></span></th>
              <th data-sort="Total Logos" className="sortable">Total Logos <span className="sort-indicator"></span></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => ( // Loop through 'orders' array (received as a prop)
                // IMPORTANT: Use a unique key for each row!
                <tr key={order.SORD} data-sord={order.SORD}>
                    <td>{order.SORD}</td>
                    <td>{order["Trader Code"]}</td>
                    <td>{order["Trader Name"]}</td>
                    <td>{order["Total Items"]}</td>
                    <td>{order["Ordered Date"]}</td>
                    <td>{order["Due Date"]}</td>
                    <td>{order["Total Logos"]}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
}

export default OrderTable;