// generate_customer_pages.js

const fs = require('fs');
const path = require('path');

const CUSTOMERS_FILE = path.join(__dirname, 'customers.json');
const TEMPLATE_FILE = path.join(__dirname, 'src', 'pages', 'customer_template.html');
const OUTPUT_DIR = path.join(__dirname, 'src', 'pages', 'customer_pages');
const THREADS_FILE = path.join(__dirname, 'threads.json');

async function generateCustomerPages() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    const customersData = readJSON(CUSTOMERS_FILE);
    const threadsData = readJSON(THREADS_FILE);
    let templateHtml = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
  
      // Update the navigation links in the template HTML
    templateHtml = templateHtml.replace(
        `<ul class="nav-links">
                    <li><a href="index.html">Home</a></li>
                    <li><a href="threads.html">Thread Manager</a></li>
                </ul>`,
        `<ul class="nav-links">
                    <li><a href="../index.html">Home</a></li>
                    <li><a href="../threads.html">Thread Manager</a></li>
                    <li><a href="../proof_creator.html">Proof Creator</a></li>
                </ul>`
    );

    for (const customer of customersData) {
        const customerPageHtml = generatePageForCustomer(customer, templateHtml, threadsData);
        const customerNameSlug = customer.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        const outputPath = path.join(OUTPUT_DIR, `${customerNameSlug}.html`);

        fs.writeFileSync(outputPath, customerPageHtml, 'utf-8');
        console.log(`Generated page for customer: ${customer.name} (ID: ${customer.id})`);
    }

    console.log('Customer page generation complete!');
}
let proofCreatorCanvas;
function generatePageForCustomer(customer, templateHtml, threadsData) {
    let pageHtml = templateHtml;

    pageHtml = pageHtml.replace(/\[CUSTOMER_NAME\]/g, customer.name);
    pageHtml = pageHtml.replace(/\[CONTACT_PERSON\]/g, customer.contactPerson || 'N/A');
    pageHtml = pageHtml.replace(/\[CUSTOMER_EMAIL\]/g, customer.email || 'N/A');

    // Generate logo HTML
    let logoImagesHtml = '';
    if (customer.logos && customer.logos.length > 0) {
        customer.logos.forEach((logo, index) => {
            let logoSrc;
            let logoAltText;

            if (typeof logo === 'string') {
                logoSrc = logo;
                logoAltText = customer.name + " Logo";
            } else if (typeof logo === 'object' && logo.logoUrl) {
                logoSrc = logo.logoUrl;
                logoAltText = logo.logoName || customer.name + " Logo";
            } else {
                return;
            }

            logoImagesHtml += `
                <div class="logo-item">
                    <img src="${logoSrc}" alt="${logoAltText}">
                    <p class="logo-name"><strong>Name:</strong> ${logo.logoName || 'N/A'}</p>
                    <p class="logo-position"><strong>Position:</strong> ${logo.logoPosition || 'Unspecified'}</p>
                    <p class="logo-type"><strong>Type:</strong> ${logo.logoType || 'N/A'}</p>
                    <p class="logo-threads"><strong>Threads:</strong> ${logo.threadNumbers ? logo.threadNumbers.join(', ') : 'N/A'}</p>
                    <div class="logo-actions">
                        <button class="delete-logo-button" onclick="deleteLogo(${customer.id}, ${index})" data-logo-index="${index}">Delete Logo</button>
                    </div>
                </div>
            `;
        });
    } else {
        logoImagesHtml = '<p>No logos added yet.</p>';
    }


    pageHtml = pageHtml.replace(
        `<div class="logo-grid" id="customer-logo-grid"><!-- Logo images will be inserted here by the script --></div>`,
        `<div class="logo-grid" id="customer-logo-grid">
                    <!-- Logo images will be inserted here by the script -->
                    ${logoImagesHtml}
                </div>`
    );

    pageHtml = pageHtml.replace(/<title>.*?<\/title>/g, `<title>${customer.name} - Customer Page</title>`);
    pageHtml = pageHtml.replace(/<h1>.*?<\/h1>/g, `<h1>${customer.name}</h1>`);

    pageHtml = pageHtml.replace(/<p><strong>Customer Name:<\/strong>.*?<\/p>/g, `<p><strong>Customer Name:</strong> ${customer.name}</p>`);
    pageHtml = pageHtml.replace(/<p><strong>Contact:<\/strong>.*?<\/p>/g, `<p><strong>Contact:</strong> ${customer.contactPerson || 'N/A'}</p>`);
    pageHtml = pageHtml.replace(/<p><strong>Email:<\/strong>.*?<\/p>/g, `<p><strong>Email:</strong> ${customer.email || 'N/A'}</p>`);
    pageHtml = pageHtml.replace(
        `</section>`,
        `       <button id="delete-customer-button" class="delete-customer-button" onclick="deleteCustomer(${customer.id})">Delete Customer</button>
            </section>`
    );

    // Generate Threads Used HTML
    let threadsUsedHtml = '';
    const uniqueThreadNumbers = new Set();

    if (customer.logos && customer.logos.length > 0) {
        customer.logos.forEach(logo => {
            if (logo.threadNumbers && logo.threadNumbers.length > 0) {
                logo.threadNumbers.forEach(threadNumber => {
                    uniqueThreadNumbers.add(threadNumber);
                });
            }
        });

        if (uniqueThreadNumbers.size > 0) {
            uniqueThreadNumbers.forEach(threadNumber => {
                const threadData = threadsData.find(thread => thread["Thread Number"] === threadNumber);
                if (threadData) {
                    threadsUsedHtml += `
                        <li>
                            Thread Number: ${threadNumber}
                            <span class="thread-colour-circle" style="background-color: ${threadData.Hex || '#ccc'};" title="${threadData.Colours.Colour || 'Unknown Colour'}"></span>
                            (Stock: ${threadData.Colours["Stock Quantity"] || 'N/A'})
                        </li>
                    `;
                } else {
                    threadsUsedHtml += `
                        <li>
                            <div class="thread-swatch" style="background-color: #ccc;"></div>
                            Thread Number: ${threadNumber} (Stock: N/A - Not in Stock List)
                        </li>
                    `;
                }
            });
        } else {
            threadsUsedHtml = '<p>No threads specified for logos yet.</p>';
        }
    } else {
        threadsUsedHtml = '<p>No logos added yet, so no threads used.</p>';
    }


    pageHtml = pageHtml.replace(
        ` <ul id="customer-threads-list">
                    <!-- Threads will be inserted here by the script -->
                </ul>`,
        ` <ul id="customer-threads-list">
                    <!-- Threads will be inserted here by the script -->
                    ${threadsUsedHtml}
                </ul>`
    );


   // --- Proofs Table (NO FORM HERE ANYMORE) ---
    let proofsHtml = `
        <table id="proofs-table">
            <thead>
                <tr>
                    <th>Preview</th>
                    <th>Garment Code</th>
                    <th>Logo</th>
                    <th>Position</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (customer.proofs && customer.proofs.length > 0) {
        customer.proofs.forEach((proof, index) => {
            proofsHtml += `
                <tr data-proof-index="${index}">
                  <td><a href="${proof.url}" target="_blank">View Proof</a></td>
                    <td>${proof.garmentCode}</td>
                    <td>${proof.logo}</td>
                    <td>${proof.logoPosition}</td>
                    <td>${proof.description || 'N/A'}</td>
                    <td>
                        <button class="delete-proof-button" onclick="handleProofDelete(${customer.id}, ${index})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } else { // Corrected ELSE placement
        proofsHtml += '<tr><td colspan="6">No proofs added yet.</td></tr>';
    }

    proofsHtml += `
            </tbody>
        </table>
    `;

     pageHtml = pageHtml.replace(
        `<div id="proofs-container"></div>`,
        `<div id="proofs-container">${proofsHtml}</div>`
    );



    // ---  Add Proof Button and Create Proof Button (Inserted within customer-proofs section) ---
        const addProofButtonHtml = `<button id="add-proof-button" onclick="openProofModal(${customer.id})">Add Proof</button>`;
        // const createProofButtonHtml = `<button id="create-proof-button" onclick="openProofCreatorModal(${customer.id})">Create Proof</button>`;

      pageHtml = pageHtml.replace(
        `<h2>Proofs</h2>`,
        `<h2>Proofs</h2>
        <div class="button-container">
         ${addProofButtonHtml}

         </div>`
       );

    // --- MODAL HTML (Inserted BEFORE </body>) ---
    const modalHtml = `
    <div id="upload-proof-modal-${customer.id}" class="modal">
        <div class="modal-content">
            <span class="close-button" onclick="closeProofModal(${customer.id})">×</span>
            <h2>Upload Proof for ${customer.name}</h2>
            <form id="upload-proof-form-${customer.id}" onsubmit="return false;">
                <input type="file" id="proof-upload-input" name="proof-upload-input" accept=".pdf" required>
                <input type="text" id="proof-garment-code" name="garmentCode" placeholder="Garment Code" required>
                <input type="text" id="proof-logo" name="logo" placeholder="Logo" required>
                <input type="text" id="proof-logo-position" name="logoPosition" placeholder="Logo Position" required>
                <textarea id="proof-description" name="proofDescription" placeholder="Optional Description"></textarea>
                <button type="button" onclick="handleProofUpload(${customer.id})">Upload Proof</button>
            </form>
        </div>
    </div>
    `;
   pageHtml = pageHtml.replace('</body>', `${modalHtml}</body>`);


   


    // --- JAVASCRIPT FUNCTIONS (Inserted BEFORE </body>) ---

   // 1. deleteLogo (Same as before)
    const deleteLogoFunctionString = `
        async function deleteLogo(customerId, logoIndex) {
             console.log(\`Attempting to delete logo at index \${logoIndex} for customer ID \${customerId}\`);

            const confirmDelete = confirm("Are you sure you want to delete this logo?");
            if (!confirmDelete) {
                console.log('Delete logo cancelled by user.');
                return; // Stop if user cancels
            }

            try {
                const response = await fetch(\`/api/customers/\${customerId}/logos/\${logoIndex}\`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const message = await response.json();
                    throw new Error(\`HTTP error! status: \${response.status}, message: \${message.error}\`);
                }

                const result = await response.json();
                console.log('Logo deleted successfully:', result);

                alert(result.message); // Show success message

                // Remove the logo item from the DOM (customer page)
                const logoItemToDelete = document.querySelector(\`.logo-item button.delete-logo-button[data-logo-index="\${logoIndex}"]\`).closest('.logo-item');
                if (logoItemToDelete) {
                    logoItemToDelete.remove();
                }
            } catch (error) {
                console.error('Error deleting logo:', error);
                alert(\`Failed to delete logo: \${error.message}\`);
            }
        }
    `;
    pageHtml = pageHtml.replace('</body>', `<script>${deleteLogoFunctionString}</script></body>`);

    // 2. deleteCustomer (Same as before)
    const deleteCustomerFunctionString = `
    async function deleteCustomer(customerId) {
            console.log(\`Attempting to delete customer with ID: \${customerId}\`);

            const confirmDelete = confirm("Are you REALLY sure you want to delete this customer?\\nThis action cannot be undone and will delete all customer data including logos and threads!");
            if (!confirmDelete) {
                console.log('Customer deletion cancelled by user.');
                return; // Stop if user cancels
            }

            try {
                const response = await fetch(\`/api/customers/\${customerId}\`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const message = await response.json();
                    throw new Error(\`HTTP error! status: \${response.status}, message: \${message.error}\`);
                }

                const result = await response.json();
                console.log('Customer deleted successfully:', result);
                alert(result.message); // Show success message

                // Redirect back to the home page after successful deletion
                window.location.href = '/index.html';


            } catch (error) {
                console.error('Error deleting customer:', error);
                alert(\`Failed to delete customer: \${error.message}\`);
            }
        }
    `;
     pageHtml = pageHtml.replace('</body>', `<script>${deleteCustomerFunctionString}</script></body>`);

    // 3. createProofTableRow (Corrected to pass customerId)
        const addProofToTableFunctionString = `
function createProofTableRow(proof, index, customerId) { // Add customerId parameter
        return \`
        <tr data-proof-index="\${index}">
        <td><a href="\${proof.url}" target="_blank">View Proof</a></td>
          <td>\${proof.garmentCode}</td>
          <td>\${proof.logo}</td>
          <td>\${proof.logoPosition}</td>
          <td>\${proof.description || 'N/A'}</td>
           <td>
                <button class="delete-proof-button" onclick="handleProofDelete(\${customerId}, \${index})">Delete</button>
            </td>
        </tr>
      \`;
    }
    `;
    pageHtml = pageHtml.replace('</body>', `<script>${addProofToTableFunctionString}</script></body>`);

    // 4. handleProofUpload (Corrected index calculation)
        const handleProofUploadFunctionString = `
async function handleProofUpload(customerId) {
    console.log(\`handleProofUpload called for customer ID: \${customerId}\`);
    const fileInput = document.getElementById('proof-upload-input'); // NO customer-specific ID
    const garmentCodeInput = document.getElementById('proof-garment-code');
    const logoInput = document.getElementById('proof-logo');
    const logoPositionInput = document.getElementById('proof-logo-position');
    const descriptionInput = document.getElementById('proof-description');

    const file = fileInput.files[0];
    const garmentCode = garmentCodeInput.value.trim();
    const logo = logoInput.value.trim();
    const logoPosition = logoPositionInput.value.trim();
    const proofDescription = descriptionInput.value.trim();

    if (!file) {
        alert('Please select a PDF file to upload.');
        return;
    }

    if (!garmentCode || !logo || !logoPosition) {
        alert('Please fill in Garment Code, Logo, and Logo Position.');
        return;
    }

    const formData = new FormData();
    formData.append('proof-upload-input', file);
    formData.append('garmentCode', garmentCode);
    formData.append('logo', logo);
    formData.append('logoPosition', logoPosition);
    formData.append('proofDescription', proofDescription);

    const proofsTableBody = document.querySelector('#proofs-table tbody'); // Get tbody

    try {
        const response = await fetch(\`/api/customers/\${customerId}/proofs\`, {
            method: 'PUT',
            body: formData,
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fileInput.value = '';
            garmentCodeInput.value = '';
            logoInput.value = '';
            logoPositionInput.value = '';
            descriptionInput.value = '';
            console.log("proof details", result.proof);

            // Add the new proof to the table *on the current page*:
            const newRow = createProofTableRow(result.proof, proofsTableBody.rows.length, customerId); // Corrected index
            proofsTableBody.insertAdjacentHTML('beforeend', newRow); // Add to the end

            closeProofModal(customerId); // Close the modal

        } else {
            const message = await response.json();
            throw new Error(message.error || 'Failed to upload proof.');
        }

    }
    catch (error) {
        console.error('Error uploading proof:', error);
        alert(error.message);
    }
}
`;

  pageHtml = pageHtml.replace('</body>', `<script>${handleProofUploadFunctionString}</script></body>`);

    // 5. handleProofDelete (Same as before)
    const handleProofDeleteFunctionString = `
        async function handleProofDelete(customerId, proofIndex) {
          console.log(\`handleProofDelete called for customer ID: \${customerId}, and proof index: \${proofIndex} \`);
          if (!confirm('Are you sure you want to delete this proof?')) {
                return;
            }

            try {
                const response = await fetch(\`/api/customers/\${customerId}/proofs/\${proofIndex}\`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const message = await response.json();
                    throw new Error(\`HTTP error! status: \${response.status}, message: \${message.error}\`);
                }
                const result = await response.json();
                console.log('Proof deleted successfully:', result);
                alert(result.message);

                // Find and remove the table row
                const rowToDelete = document.querySelector(\`#proofs-table tbody tr[data-proof-index="\${proofIndex}"]\`);
                if (rowToDelete) {
                    rowToDelete.remove();
                }
            } catch (error) {
                    console.error('Error deleting proof:', error);
                alert(\`Failed to delete proof: \${error.message}\`);
           }
        }
    `;
  pageHtml = pageHtml.replace('</body>', `<script>${handleProofDeleteFunctionString}</script></body>`);
   // 6. openProofModal and closeProofModal (NEW)

    const modalFunctionsString = `
       function openProofModal(customerId) {
            const modal = document.getElementById(\`upload-proof-modal-\${customerId}\`);
             if (modal) {
                modal.style.display = 'block';
                console.log(\`upload-proof-modal-\${customerId} opened\`)
             } else {
                console.error('Modal not found for customer ID:', customerId);
             }

        }

        function closeProofModal(customerId) {
            const modal = document.getElementById(\`upload-proof-modal-\${customerId}\`);
            if (modal) {
            modal.style.display = 'none';
           }
        }
    `;

    pageHtml = pageHtml.replace('</body>', `<script>${modalFunctionsString}</script></body>`);


// Add the script tag for proof_creator.js BEFORE the closing </body>
    pageHtml = pageHtml.replace('</body>', '<script src="../proof_creator.js"></script></body>');
    return pageHtml;
}

function readJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading or parsing ${path.basename(filePath)}:`, error.message);
        process.exit(1);
    }
}

// Execute the page generation
generateCustomerPages();

module.exports = { generateCustomerPages };