// server.js (Modified)

const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const fs = require("fs");
const cors = require("cors");
const { exec } = require('child_process'); // Import child_process
const { generateCustomerPages } = require('./generate_customer_pages.js');
const multer = require('multer'); // ADD THIS LINE - require multer
const pdf = require('html-pdf-node'); // ADD THIS LINE - require html-pdf-node
const fabric = require('fabric');
console.log("Fabric object:", fabric);
const pdfMake = require('pdfmake'); // ADD THIS LINE - require pdfmake
const vfsFonts = require('pdfmake/build/vfs_fonts'); // ADD THIS LINE - for fonts



const app = express();

// --- Multer Configuration (Updated) ---

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.fieldname === 'logo-upload-input') {
            uploadPath = path.join(__dirname, 'src', 'pages', 'customer_logos');
        } else if (file.fieldname === 'proof-upload-input') {
            uploadPath = path.join(__dirname, 'src', 'pages', 'customer_proofs');
        } else {
            return cb(new Error('Invalid fieldname')); // Reject unexpected fields
        }

        // Create destination folder if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            try {
                fs.mkdirSync(uploadPath, { recursive: true });
                console.log("Upload folder created successfully:", uploadPath);
            } catch (mkdirError) {
                console.error("Error creating upload folder:", mkdirError);
                return cb(mkdirError);
            }
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
    ];
     if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error('Invalid file type. Only images, SVGs, and PDFs are allowed.'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Cookie storage
let fullCookieString = "";

/**
 * Fetch session cookies from Madeira website
 */
async function fetchSessionCookies() {
  try {
    const response = await fetch("https://shop.madeira.co.uk/", {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "Referer": "https://shop.madeira.co.uk/",
        "Connection": "keep-alive"
      }
    });

    if (response.ok) {
      const setCookieHeaders = response.headers.raw()["set-cookie"];
      if (setCookieHeaders?.length) {
        // Store cookies in 'key=value; key2=value2' format
        fullCookieString = setCookieHeaders
          .map(cookie => cookie.split(";")[0])
          .join("; ");

        console.log("Session cookies updated:", fullCookieString);
      } else {
        console.error("No cookies found in response");
      }
    } else {
      console.error(`Cookie fetch failed: ${response.status}`);
    }
  } catch (error) {
    console.error("Cookie refresh error:", error.message);
  }
}

/**
 * Start session refresher with initial fetch and periodic updates
 */
async function startSessionRefresher() {
  try {
    await fetchSessionCookies();
    // Refresh every 5 minutes (300,000 ms)
    setInterval(fetchSessionCookies, 300000);
  } catch (error) {
    console.error("Initial session setup failed:", error);
  }
}

// Initialize session management
startSessionRefresher();

// Serve your static front-end (index.html, threads.html, etc.)
app.use(express.static(path.join(__dirname, "src", "pages")));

/**
 * Proxy endpoint with session management.
 * We also add CORS headers so we can read image pixel data in the browser.
 */
app.get("/proxy/*", async (req, res) => {
  // If cookies haven't been loaded yet, abort
  if (!fullCookieString) {
    return res.status(503).send("Session not initialized");
  }

  try {
    // e.g. /proxy/https%3A%2F%2Fshop.madeira.co.uk%2FsomePath
    const targetUrl = decodeURIComponent(req.params[0]);
    console.log("Proxying request to:", targetUrl);

    const proxyResponse = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "Referer": "https://shop.madeira.co.uk/",
        "Cookie": fullCookieString
      }
    });

    // Add CORS header to allow reading pixel data
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Forward the status code
    res.status(proxyResponse.status);

    // Forward certain headers like content-type, cache-control, etc.
    const headersToForward = ["content-type", "cache-control", "expires", "content-length"];
    headersToForward.forEach(header => {
      const value = proxyResponse.headers.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    });

    // Stream the final response
    const buffer = await proxyResponse.buffer();
    res.send(buffer);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send(`Proxy error: ${error.message}`);
  }
});

/**
 * API Endpoint to Get All Threads
 * GET /api/threads
 */
app.get("/api/threads", (req, res) => {
  const THREADS_FILE = path.join(__dirname, "threads.json"); // Ensure threads.json is in the root directory
  console.log("GET /api/threads called");

  fs.readFile(THREADS_FILE, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading threads.json:", err);
      return res.status(500).json({ error: "Failed to read thread data." });
    }
    try {
      const threads = JSON.parse(data);
      console.log("Successfully parsed threads.json");
      res.json(threads);
    } catch (parseError) {
      console.error("Error parsing threads.json:", parseError);
      res.status(500).json({ error: "Invalid thread data format." });
    }
  });
});

/**
 * API Endpoint to Get Madeira Threads
 * GET /api/madeiraThreads
 */
app.get("/api/madeiraThreads", (req, res) => {
  const madeiraThreadsPath = path.join(__dirname, "madeiraThreads.json");
  fs.readFile(madeiraThreadsPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading madeiraThreads.json:", err);
      return res.status(500).json({ error: "Failed to read Madeira Threads data." });
    }
    try {
      const madeiraThreads = JSON.parse(data);
      res.json(madeiraThreads);
    } catch (parseError) {
      console.error("Error parsing madeiraThreads.json:", parseError);
      res.status(500).json({ error: "Invalid Madeira Threads data format." });
    }
  });
});

/**
 * Helper function to run updateThreads.js
 */
function runUpdateThreads() {
  console.log('Running updateThreads.js...');
  return new Promise((resolve, reject) => {
      exec('node updateThreads.js', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing updateThreads.js: ${error.message}`);
              reject(error);
          }
         if (stderr) {
            console.error(`updateThreads.js stderr: ${stderr}`);
         }
          console.log(`updateThreads.js stdout: ${stdout}`);
        resolve(stdout)
      });
  })
}

/**
 * API Endpoint to Add a New Thread
 * POST /api/threads
 */
app.post("/api/threads", async (req, res) => {
  const newThread = req.body;
  console.log("POST /api/threads called with data:", newThread);

  const THREADS_FILE = path.join(__dirname, "threads.json"); // Ensure threads.json is in the root directory

  // Validate required fields
  if (
    !newThread["ThreadNumber"] ||
    !newThread["Colours"] ||
    !newThread["Colours"]["Colour"]
  ) {
    return res.status(400).json({ error: "Thread Number and Colour are required." });
  }

  fs.readFile(THREADS_FILE, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading threads.json:", err);
      return res.status(500).json({ error: "Failed to read thread data." });
    }

    let threads;
    try {
      threads = JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing threads.json:", parseError);
      return res.status(500).json({ error: "Invalid thread data format." });
    }

    // Optionally, check for duplicate Thread Number and Thread No (thickness)
    const duplicate = threads.find(t =>
      t["Thread Number"] === newThread["Thread Number"] &&
      t["Thread No (thickness)"] === newThread["Thread No (thickness)"]
    );
    if (duplicate) {
      return res.status(400).json({ error: "Thread with the same Thread Number and Thread No (thickness) already exists." });
    }

    // Assign a unique numeric id
    const newId = threads.length > 0 ? Math.max(...threads.map(t => t.id)) + 1 : 1;
    newThread.id = newId;

    threads.push(newThread);

    fs.writeFile(THREADS_FILE, JSON.stringify(threads, null, 2), "utf8", async (err) => {
      if (err) {
        console.error("Error writing to threads.json:", err);
        return res.status(500).json({ error: "Failed to add new thread." });
      }
     try {
        await runUpdateThreads();
        res.status(201).json({ message: "Thread added successfully.", thread: newThread });
      }
      catch (error) {
        console.error("Error running updateThreads.js:", error);
        res.status(500).json({ error: `Failed to add new thread: ${error.message}` });
      }
      console.log(`New thread added with ID ${newThread.id}.`);
    });
  });
});

/**
 * API Endpoint to Update a Thread
 * PUT /api/threads/:id
 */
app.put("/api/threads/:id", async (req, res) => {
    const threadId = Number(req.params.id);
    const updatedThread = req.body;
    console.log(`PUT /api/threads/${threadId} called with data:`, JSON.stringify(updatedThread, null, 2));

    const THREADS_FILE = path.join(__dirname, "threads.json"); // Ensure threads.json is in the root directory

    // Validate required fields
    if (
      !updatedThread["ThreadNumber"] ||
      !updatedThread["Colours"] ||
      !updatedThread["Colours"]["Colour"]
    ) {
      console.log("Validation failed: Thread Number or Colour missing.");
      return res.status(400).json({ error: "Thread Number and Colour are required." });
    }

    fs.readFile(THREADS_FILE, "utf8", async (err, data) => {
      if (err) {
        console.error("Error reading threads.json:", err);
        return res.status(500).json({ error: "Failed to read thread data." });
      }

      let threads;
      try {
        threads = JSON.parse(data);
      } catch (parseError) {
        console.error("Error parsing threads.json:", parseError);
        return res.status(500).json({ error: "Invalid thread data format." });
      }

      const index = threads.findIndex(t => t.id === threadId);

      if (index === -1) {
        console.warn(`Thread with ID ${threadId} not found.`);
        return res.status(404).json({ error: "Thread not found." });
      }

      // Ensure the id remains unchanged
      updatedThread.id = threadId;

      // Log existing thread before update
      console.log("Existing thread before update:", JSON.stringify(threads[index], null, 2));

      // Update the thread
      threads[index] = updatedThread;
      console.log(`Thread with ID ${threadId} updated to:`, JSON.stringify(updatedThread, null, 2));

      fs.writeFile(THREADS_FILE, JSON.stringify(threads, null, 2), "utf8", async (err) => {
        if (err) {
          console.error("Error writing to threads.json:", err);
          return res.status(500).json({ error: "Failed to update thread data." });
        }
       try {
            await runUpdateThreads();
           res.json({ message: "Thread updated successfully.", thread: updatedThread });
        } catch (error) {
            console.error("Error running updateThreads.js:", error);
          res.status(500).json({ error: `Failed to update thread data: ${error.message}` });
        }
        console.log(`threads.json successfully updated for Thread ID ${threadId}.`);
      });
    });
  });


app.delete("/api/threads/:id", async (req, res) => {
  const threadId = Number(req.params.id);
  console.log(`DELETE /api/threads/${threadId} called`);

  const THREADS_FILE = path.join(__dirname, "threads.json");

  fs.readFile(THREADS_FILE, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading threads.json:", err);
      return res.status(500).json({ error: "Failed to read thread data for deletion." });
    }

    let threads;
    try {
      threads = JSON.parse(data);
    } catch (parseError) {
      console.error("Error parsing threads.json:", parseError);
      return res.status(500).json({ error: "Invalid thread data format." });
    }

    const initialLength = threads.length;
    threads = threads.filter(t => t.id !== threadId);

    if (threads.length === initialLength) {
      console.warn(`Thread with ID ${threadId} not found for deletion.`);
      return res.status(404).json({ error: "Thread not found for deletion." });
    }

    fs.writeFile(THREADS_FILE, JSON.stringify(threads, null, 2), "utf8", async (err) => {
      if (err) {
        console.error("Error writing to threads.json:", err);
        return res.status(500).json({ error: "Failed to update thread data after deletion." });
      }
      try {
          await runUpdateThreads(); // Re-run updateThreads after deletion
          res.json({ message: "Thread deleted successfully.", id: threadId });
      } catch (error) {
          console.error("Error running updateThreads.js after delete:", error);
          res.status(500).json({ error: `Failed to delete thread data: ${error.message}` });
      }
      console.log(`Thread with ID ${threadId} successfully deleted from threads.json.`);
    });
  });
});

/**
 * --- ADD THIS BLOCK TO server.js ---
 * API Endpoint to Get All Customers
 * GET /api/customers
 */
app.get("/api/customers", (req, res) => {
    const CUSTOMERS_FILE = path.join(__dirname, "customers.json");
    console.log("GET /api/customers called");

    fs.readFile(CUSTOMERS_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading customers.json:", err);
            return res.status(500).json({ error: "Failed to read customer data." });
        }
        try {
            const customers = JSON.parse(data);
            console.log("Successfully parsed customers.json");
            res.json(customers);
        } catch (parseError) {
            console.error("Error parsing customers.json:", parseError);
            res.status(500).json({ error: "Invalid customer data format." });
        }
    });
});

/**
 * API Endpoint to Add a New Customer
 * POST /api/customers
 */
app.post("/api/customers", async (req, res) => {
    const newCustomer = req.body;
    console.log("POST /api/customers called with data:", newCustomer);

    const CUSTOMERS_FILE = path.join(__dirname, "customers.json");

    // Validate required fields (at least customer name)
    if (!newCustomer.name) {
        return res.status(400).json({ error: "Customer name is required." });
    }

    fs.readFile(CUSTOMERS_FILE, "utf8", async (err, data) => {
        if (err) {
            console.error("Error reading customers.json:", err);
            return res.status(500).json({ error: "Failed to read customer data." });
        }

        let customers;
        try {
            customers = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing customers.json:", parseError);
            return res.status(500).json({ error: "Invalid customer data format." });
        }

        // Assign a unique numeric id
        const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
        newCustomer.id = newId;

        customers.push(newCustomer);

        fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8", (err) => {
            if (err) {
                console.error("Error writing to customers.json:", err);
                return res.status(500).json({ error: "Failed to add new customer." });
            }
            res.status(201).json({ message: "Customer added successfully.", customer: newCustomer });
            console.log(`New customer added with ID ${newCustomer.id}.`);
            generateCustomerPages(); 
        });
    });
});

app.put("/api/customers/:id/logos", upload.single('logo-upload-input'), async (req, res) => {
    const customerId = Number(req.params.id);
    console.log(`PUT /api/customers/${customerId}/logos called`);

    if (!req.file) {
        return res.status(400).json({ error: "No logo file uploaded." });
    }

    const logoFilename = req.file.filename;
    const logoImageUrl = `/customer_logos/${logoFilename}`;

    // 1. Receive Logo Details from Request Body
    const logoName = req.body.logoName;
    const logoPosition = req.body.logoPosition;
    const logoType = req.body.logoType;
    const threadNumbers = req.body.threadNumbers ? req.body.threadNumbers.split(',').map(s => s.trim()) : []; // Split comma-separated string into array

    console.log("Uploaded logo filename:", logoFilename);
    console.log("Logo image URL:", logoImageUrl);
    console.log("Logo Name:", logoName);
    console.log("Logo Position:", logoPosition);
    console.log("Logo Type:", logoType);
    console.log("Thread Numbers:", threadNumbers);


    const CUSTOMERS_FILE = path.join(__dirname, "customers.json");

    fs.readFile(CUSTOMERS_FILE, "utf8", async (err, data) => {
        if (err) {
            console.error("Error reading customers.json:", err);
            return res.status(500).json({ error: "Failed to read customer data." });
        }

        let customers;
        try {
            customers = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing customers.json:", parseError);
            return res.status(500).json({ error: "Invalid customer data format." });
        }

        const customerIndex = customers.findIndex(c => c.id === customerId);

        if (customerIndex === -1) {
            return res.status(404).json({ error: "Customer not found." });
        }

        const customer = customers[customerIndex];

        if (!customer.logos) {
            customer.logos = [];
        }

        // 2. Update customers.json to store full logo details
        const newLogoEntry = {
            logoUrl: logoImageUrl,
            logoName: logoName || "No Name", // Default to "No Name" if empty
            logoPosition: logoPosition || "Unspecified", // Default to "Unspecified" if empty
            logoType: logoType || "", // Default to empty string if empty
            threadNumbers: threadNumbers // Array of thread numbers
        };
        customer.logos.push(newLogoEntry);

        customers[customerIndex] = customer;

        fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8", (err) => {
            if (err) {
                console.error("Error writing to customers.json:", err);
                return res.status(500).json({ error: "Failed to update customer data." });
            }
            res.json({ message: "Customer logo updated successfully with details.", customer: customer, logoDetails: newLogoEntry }); // Send back full logo details in response
            console.log(`Customer ID ${customerId} logo updated with details:`, newLogoEntry);
            generateCustomerPages();
        });
    });
});

/**
 * API Endpoint to Delete a Customer Logo
 * DELETE /api/customers/:customerId/logos/:logoIndex
 */
app.delete("/api/customers/:customerId/logos/:logoIndex", async (req, res) => {
    const customerId = Number(req.params.customerId);
    const logoIndex = Number(req.params.logoIndex); // Get logoIndex from URL params
    console.log(`DELETE /api/customers/${customerId}/logos/${logoIndex} called`);

    const CUSTOMERS_FILE = path.join(__dirname, "customers.json");

    fs.readFile(CUSTOMERS_FILE, "utf8", async (err, data) => {
        if (err) {
            console.error("Error reading customers.json:", err);
            return res.status(500).json({ error: "Failed to read customer data." });
        }

        let customers;
        try {
            customers = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing customers.json:", parseError);
            return res.status(500).json({ error: "Invalid customer data format." });
        }

        const customerIndex = customers.findIndex(c => c.id === customerId);

        if (customerIndex === -1) {
            return res.status(404).json({ error: "Customer not found." });
        }

        const customer = customers[customerIndex];

        if (!customer.logos || logoIndex < 0 || logoIndex >= customer.logos.length) {
            return res.status(404).json({ error: "Logo not found or invalid logo index." });
        }

        // 1. Remove the logo at the specified index
        customer.logos.splice(logoIndex, 1);

        customers[customerIndex] = customer;

        fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8", (err) => {
            if (err) {
                console.error("Error writing to customers.json:", err);
                return res.status(500).json({ error: "Failed to update customer data." });
            }
            res.json({ message: "Customer logo deleted successfully.", customer: customer });
            console.log(`Customer ID ${customerId} logo at index ${logoIndex} deleted.`);
            generateCustomerPages(); // Re-generate customer pages to reflect changes
        });
    });
});

app.delete("/api/customers/:id", async (req, res) => {
    const customerId = Number(req.params.id);
    console.log(`DELETE /api/customers/${customerId} called`);

    const CUSTOMERS_FILE = path.join(__dirname, "customers.json");

    fs.readFile(CUSTOMERS_FILE, "utf8", async (err, data) => {
        if (err) {
            console.error("Error reading customers.json:", err);
            return res.status(500).json({ error: "Failed to read customer data for deletion." });
        }

        let customers;
        try {
            customers = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing customers.json:", parseError);
            return res.status(500).json({ error: "Invalid customer data format." });
        }

        const initialLength = customers.length;
        customers = customers.filter(c => c.id !== customerId);

        if (customers.length === initialLength) {
            console.warn(`Customer with ID ${customerId} not found for deletion.`);
            return res.status(404).json({ error: "Customer not found for deletion." });
        }

        fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8", async (err) => {
            if (err) {
                console.error("Error writing to customers.json:", err);
                return res.status(500).json({ error: "Failed to update customer data after deletion." });
            }
            generateCustomerPages(); // Re-generate customer pages after deletion
            res.json({ message: "Customer deleted successfully.", id: customerId });
            console.log(`Customer with ID ${customerId} successfully deleted from customers.json.`);
        });
    });
});

// --- NEW API Endpoint: Add Proof (PUT) ---
app.put("/api/customers/:customerId/proofs", upload.single('proof-upload-input'), async (req, res) => {
    const customerId = Number(req.params.customerId);
    console.log(`PUT /api/customers/${customerId}/proofs called`);

    if (!req.file) {
        return res.status(400).json({ error: "No proof file uploaded." });
    }

    const proofFilename = req.file.filename;
    const proofUrl = `/customer_proofs/${proofFilename}`; // URL for accessing the file

    // Get proof details from request body
    const { garmentCode, logo, logoPosition, proofDescription } = req.body;

    // Basic validation
    if (!garmentCode || !logo || !logoPosition) {
        return res.status(400).json({ error: "Garment code, logo, and logo position are required." });
    }

    const CUSTOMERS_FILE = path.join(__dirname, "customers.json");

    fs.readFile(CUSTOMERS_FILE, "utf8", async (err, data) => {
        if (err) {
            console.error("Error reading customers.json:", err);
            return res.status(500).json({ error: "Failed to read customer data." });
        }

        let customers;
        try {
            customers = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing customers.json:", parseError);
            return res.status(500).json({ error: "Invalid customer data format." });
        }

        const customerIndex = customers.findIndex(c => c.id === customerId);
        if (customerIndex === -1) {
            return res.status(404).json({ error: "Customer not found." });
        }

        const customer = customers[customerIndex];

        // Initialize proofs array if it doesn't exist
        if (!customer.proofs) {
            customer.proofs = [];
        }

        // Add the new proof to the customer's proofs array
        const newProof = {
            url: proofUrl,
            garmentCode,
            logo,
            logoPosition,
            description: proofDescription || '' // Optional description
        };
        customer.proofs.push(newProof);

        // Write the updated customer data back to customers.json
        fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8", (err) => {
            if (err) {
                console.error("Error writing to customers.json:", err);
                return res.status(500).json({ error: "Failed to update customer data." });
            }
            res.json({ message: "Proof added successfully.", proof: newProof });
            console.log(`Customer ID ${customerId} proof added:`, newProof);
            generateCustomerPages(); // Regenerate customer pages
        });
    });
});

// --- NEW API Endpoint: Delete Proof (DELETE) ---
app.delete("/api/customers/:customerId/proofs/:proofIndex", async (req, res) => {
    const customerId = Number(req.params.customerId);
    const proofIndex = Number(req.params.proofIndex);
    console.log(`DELETE /api/customers/${customerId}/proofs/${proofIndex} called`);

    const CUSTOMERS_FILE = path.join(__dirname, "customers.json");

    fs.readFile(CUSTOMERS_FILE, "utf8", async (err, data) => {
        if (err) {
            console.error("Error reading customers.json:", err);
            return res.status(500).json({ error: "Failed to read customer data." });
        }

        let customers;
        try {
            customers = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing customers.json:", parseError);
            return res.status(500).json({ error: "Invalid customer data format." });
        }

        const customerIndex = customers.findIndex(c => c.id === customerId);
        if (customerIndex === -1) {
            return res.status(404).json({ error: "Customer not found." });
        }

        const customer = customers[customerIndex];

        if (!customer.proofs || proofIndex < 0 || proofIndex >= customer.proofs.length) {
            return res.status(404).json({ error: "Proof not found or invalid proof index." });
        }

        // 1. Remove the logo file from the filesystem (IMPORTANT for cleanup)
        const proofToDelete = customer.proofs[proofIndex];  //<--- THIS LINE was missing from the original
        const proofFilePath = path.join(__dirname, 'src', 'pages', proofToDelete.url); // Correct path

        fs.unlink(proofFilePath, (err) => {
            if (err) {
                console.error("Error deleting proof file:", err);
                // We *still* want to remove the entry from the JSON, even if file deletion fails.
            }

             // 2. Remove the proof entry from the customer's proofs array
            customer.proofs.splice(proofIndex, 1);

            // 3. Write the updated customer data back to customers.json
           fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8", (err) => {
                if (err) {
                    console.error("Error writing to customers.json:", err);
                    return res.status(500).json({ error: "Failed to update customer data." });
                }
               res.json({ message: "Proof deleted successfully.", customer: customer }); // Pass back the updated customer object
                console.log(`Customer ID ${customerId} proof at index ${proofIndex} deleted.`);
                generateCustomerPages();
             });
        });

    });
});

app.put("/api/customers/:customerId/generate-proof", async (req, res) => {
    const customerId = Number(req.params.customerId);
    const proofData = req.body;

    console.log(`PUT /api/customers/${customerId}/generate-proof called`);
    console.log("Received proof data:", proofData);

    // --- 1. Prepare Document Definition for pdfmake ---
    const documentDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [ 25, 20, 25, 20 ], // [left, top, right, bottom] - Adjusted margins
        content: [
            {
                columns: [
                    [
                        {
                            image: path.join(__dirname, 'src', 'pages', 'images', 'company_logo.png'), // Path to your company logo - ADJUST PATH IF NEEDED
                            width: 90, // Adjusted logo width
                            // height: auto // Adjust height automatically
                        },
                        {
                            text: 'Approval of Company Logo',
                            style: 'header',
                            margin: [0, 80, 0, 10] // [left, top, right, bottom] - Adjusted top margin
                        },
                        {
                            text: proofData.garmentCode || 'N/A',
                            style: 'garmentCode'
                        },
                        {
                            text: proofData.proofDescription || 'N/A',
                            style: 'proofDescription',
                            margin: [0, 0, 0, 20] // Add margin below description
                        },
                    ],
                    [
                        {
                            text: 'Tel: 0333 456 1501', // Your company phone number
                            style: 'contactInfo',
                            alignment: 'right'
                        },
                        {
                            text: 'Email: sales@tbsg.co.uk', // Your company email
                            style: 'contactInfo',
                            alignment: 'right'
                        },
                    ]
                ],
                columnGap: 10
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 25, y1: 165,  // Start point (x,y) - Adjusted top line position
                        x2: 570, y2: 165,  // End point (x,y) - Adjusted length based on A4 landscape and margins
                        lineWidth: 2,
                        lineColor: '#EC008D'
                    }
                ],
                absolutePosition: { x: 25, y: 0 } // Position relative to the page - Adjusted left margin
            },
            {
                columns: [
                    proofData.canvasDataURLs[0] ? { image: dataURLtoPdfMake(proofData.canvasDataURLs[0]), width: 240 } : { text: 'No Proof Image 1', style: 'noImage' },
                    {
                        stack: [
                            proofData.canvasDataURLs[1] ? { image: dataURLtoPdfMake(proofData.canvasDataURLs[1]), width: 160 } : { text: 'No Proof Image 2', style: 'noImage' },
                            proofData.canvasDataURLs[2] ? { image: dataURLtoPdfMake(proofData.canvasDataURLs[2]), width: 160 } : { text: 'No Proof Image 3', style: 'noImage' }
                        ],
                        gap: 4
                    }
                ],
                columnGap: 4,
                margin: [0, 10, 0, 20] // [left, top, right, bottom] - Added margin below image grid
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 25, y1: 550, // Start point (x,y) - Adjusted bottom line position
                        x2: 570, y2: 550, // End point (x,y) - Adjusted length based on A4 landscape and margins
                        lineWidth: 1,
                        lineColor: '#ccc'
                    }
                ],
                absolutePosition: { x: 25, y: 0 } // Position relative to the page - Adjusted left margin
            },
            {
                columns: [
                    [
                        { text: '107 Longmead Road Emerald Park East Emersons Green Bristol BS16 7FG', style: 'footerText' },
                        { text: 'tbsg.co.uk', style: 'footerText' },
                        { text: 'Positional Guide only', style: 'footerText' }
                    ],
                    [], // Empty column for right side - adjust if needed
                ],
                margin: [0, 8, 0, 0] // [left, top, right, bottom] - Adjusted top margin for footer text
            }
        ],
        styles: {
            header: {
                fontSize: 28,
                bold: true,
                color: '#000000' // Black header text
            },
            contactInfo: {
                fontSize: 12,
                color: '#000000' // Black contact info text
            },
            garmentCode: {
                fontSize: 16,
                bold: true,
                color: '#000000' // Black garment code text
            },
            proofDescription: {
                fontSize: 16,
                color: '#000000' // Black description text
            },
            footerText: {
                fontSize: 9,
                color: '#777777' // Dark grey footer text
            },
            noImage: {
                text: 'No Image',
                fontSize: 14,
                alignment: 'center',
                margin: [0, 50, 0, 50] // Center text vertically in image area
            }
        },
        defaultStyle: {
            font: 'Poppins', // Set default font
            fontSize: 11, // Default font size
            color: '#333' // Default text colour
        },
        // --- ADDED FONTS SECTION ---
        // --- Ensure 'Poppins' font is correctly defined ---
         fonts: {
            Poppins: {
                normal: 'Poppins-Regular.ttf',
                bold: 'Poppins-Bold.ttf',
                italics: 'Poppins-Italic.ttf',
                bolditalics: 'Poppins-BoldItalic.ttf',
            }
        },
    };

    // --- 2. Register custom fonts with pdfMake ---
    const pdfDocDefinition = {
        ...documentDefinition,
        defaultStyle: { font: 'Poppins' },
        fonts: {
            Poppins: {
                normal: vfsFonts.pdfMake.vfs['Poppins-Regular.ttf'], // Access vfs directly
                bold: vfsFonts.pdfMake.vfs['Poppins-Bold.ttf'],
                italics: vfsFonts.pdfMake.vfs['Poppins-Italic.ttf'],
                bolditalics: vfsFonts.pdfMake.vfs['Poppins-BoldItalic.ttf'],
            }
        }
    };


    // --- 3. Create PDF document using pdfMake ---
    const printer = new pdfMake({ vfs: vfsFonts.pdfMake.vfs, Poppins:  new Buffer(require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Poppins-Regular.ttf'], 'base64') }); // Initialize printer with fonts
    const pdfDoc = printer.createPdfKitDocument(pdfDocDefinition);
    let chunks = [];
    let pdfResult = null;

    pdfDoc.on('readable', function() {
        let chunk;
        while ((chunk = pdfDoc.read())) {
            chunks.push(chunk);
        }
    });
    pdfDoc.on('end', function() {
        pdfResult = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="customer_proof_${customerId}.pdf"`);
        res.send(pdfResult);
    });
    pdfDoc.end();

});

// --- Helper function to convert Data URL to pdfMake image format ---
function dataURLtoPdfMake(base64String) {
    return { image: base64String,  width: 500  }; // Adjust width as needed, remove maxHeight/maxWidth
}


// Helper function to convert Data URL to Blob - ensure this is included as well
function dataURLtoBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';');
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString[0] });
}


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});