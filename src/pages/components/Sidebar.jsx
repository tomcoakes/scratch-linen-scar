// src/pages/components/Sidebar.jsx
import React from 'react';

function Sidebar() {
    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-header">
                <h2>Upload & Actions</h2>
                <button id="toggle-sidebar" className="toggle-sidebar-button">
                    <i className="fas fa-chevron-left"></i> {/* Icon changes based on state */ }
                </button>
            </div>
            <div className="drop-area" id="dropArea">
                <p>Drag & Drop CSV File Here</p>
                <p>or</p>
                <button id="fileButton" className="primary-btn">Choose File</button>
                <input type="file" id="fileInput" accept=".csv" style="display: none;" />
            </div>
            <div id="delete-area" className="delete-area">
                <i className="fas fa-trash-alt"></i> Drag orders here to DELETE
            </div>
        </aside>
    );
}

export default Sidebar; // Export the component