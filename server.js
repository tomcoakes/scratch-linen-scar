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
//console.log("Fabric object:", fabric);
const garmentCataloguePath = path.join(__dirname, 'garment_catalogue.json'); // Path to your new JSON file
const request = require('request');

const AWS = require('aws-sdk');
const csvParser = require('csv-parser');


 



const app = express();
app.use(cors());


// --- Multer Configuration (Updated) ---

const storage = multer.memoryStorage()

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         let uploadPath;
//         if (file.fieldname === 'logo-upload-input') {
//             uploadPath = path.join(__dirname, 'src', 'pages', 'customer_logos');
//         } else if (file.fieldname === 'proof-upload-input') {
//             uploadPath = path.join(__dirname, 'src', 'pages', 'customer_proofs');
//         } else {
//             return cb(new Error('Invalid fieldname')); // Reject unexpected fields
//         }

//         // Create destination folder if it doesn't exist
//         if (!fs.existsSync(uploadPath)) {
//             try {
//                 fs.mkdirSync(uploadPath, { recursive: true });
//                 console.log("Upload folder created successfully:", uploadPath);
//             } catch (mkdirError) {
//                 console.error("Error creating upload folder:", mkdirError);
//                 return cb(mkdirError);
//             }
//         }
//         cb(null, uploadPath);
//     },
//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const fileExtension = path.extname(file.originalname);
//         cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
//     }
// });

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
    !newThread["Thread Number"] ||
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
      !updatedThread["Thread Number"] ||
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




const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});





// --- Updated API Endpoint: Add Logo (PUT) - Uploads to S3 ---
app.put("/api/customers/:id/logos", upload.single('logo-upload-input'), async (req, res) => {
    const customerId = Number(req.params.id);
    console.log(`PUT /api/customers/${customerId}/logos - Uploading to S3`);

    if (!req.file) {
        return res.status(400).json({ error: "No logo file uploaded." });
    }
  
  console.log("req.file object:", req.file);
  const fileMimeType = req.file.mimetype; // ADD THIS LINE - Get MIME type from multer

    // --- S3 Upload Parameters ---
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME, // Use bucket name from .env
        Key: `customer_logos/${Date.now()}-${req.file.originalname}`, // Unique key (filename) in S3 bucket
        Body: req.file.buffer, // Use file buffer directly from multer
        // ACL: 'public-read' // Make logo images publicly accessible (adjust permissions as needed)
        ContentType: fileMimeType === 'image/svg+xml' ? 'image/svg+xml' : fileMimeType
    };
    

    try {
        console.log("Attempting to upload to S3...");
        const s3UploadResult = await s3.upload(uploadParams).promise();
        console.log("S3 upload successful:", s3UploadResult);

        const logoImageUrl = s3UploadResult.Location; // URL of the uploaded logo in S3

        // 1. Receive Logo Details from Request Body (same as before)
        const logoName = req.body.logoName;
        const logoPosition = req.body.logoPosition;
        const logoType = req.body.logoType;
        const threadNumbers = req.body.threadNumbers ? req.body.threadNumbers.split(',').map(s => s.trim()) : [];

        console.log("Logo Name:", logoName);
        console.log("Logo Position:", logoPosition);
        console.log("Logo Type:", logoType);
        console.log("Thread Numbers:", threadNumbers);


        const CUSTOMERS_FILE = path.join(__dirname, "customers.json");

        const data = fs.readFileSync(CUSTOMERS_FILE, "utf8");
        let customers = JSON.parse(data);
        const customerIndex = customers.findIndex(c => c.id === customerId);

        if (customerIndex === -1) {
            return res.status(404).json({ error: "Customer not found." });
        }

        const customer = customers[customerIndex];
        if (!customer.logos) {
            customer.logos = [];
        }

        // 2. Update customers.json to store full logo details (using S3 URL)
        const newLogoEntry = {
            logoUrl: logoImageUrl, // Store S3 URL here
            logoName: logoName || "No Name",
            logoPosition: logoPosition || "Unspecified",
            logoType: logoType || "",
            threadNumbers: threadNumbers
        };
        customer.logos.push(newLogoEntry);

        customers[customerIndex] = customer;

        fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8");
        res.json({ message: "Customer logo updated successfully with details (uploaded to S3).", customer: customer, logoDetails: newLogoEntry });
        console.log(`Customer ID ${customerId} logo updated with details (S3 URL):`, newLogoEntry);
        generateCustomerPages();


    } catch (error) {
        console.error("Error in S3 logo upload:", error);
        return res.status(500).json({ error: `Failed to upload logo to S3: ${error.message}` });
    }
});













// app.put("/api/customers/:id/logos", upload.single('logo-upload-input'), async (req, res) => {
//     const customerId = Number(req.params.id);
//     console.log(`PUT /api/customers/${customerId}/logos called`);

//     if (!req.file) {
//         return res.status(400).json({ error: "No logo file uploaded." });
//     }

//     const logoFilename = req.file.filename;
//     const logoImageUrl = `/customer_logos/${logoFilename}`;

//     // 1. Receive Logo Details from Request Body
//     const logoName = req.body.logoName;
//     const logoPosition = req.body.logoPosition;
//     const logoType = req.body.logoType;
//     const threadNumbers = req.body.threadNumbers ? req.body.threadNumbers.split(',').map(s => s.trim()) : []; // Split comma-separated string into array

//     console.log("Uploaded logo filename:", logoFilename);
//     console.log("Logo image URL:", logoImageUrl);
//     console.log("Logo Name:", logoName);
//     console.log("Logo Position:", logoPosition);
//     console.log("Logo Type:", logoType);
//     console.log("Thread Numbers:", threadNumbers);


//     const CUSTOMERS_FILE = path.join(__dirname, "customers.json");

//     fs.readFile(CUSTOMERS_FILE, "utf8", async (err, data) => {
//         if (err) {
//             console.error("Error reading customers.json:", err);
//             return res.status(500).json({ error: "Failed to read customer data." });
//         }

//         let customers;
//         try {
//             customers = JSON.parse(data);
//         } catch (parseError) {
//             console.error("Error parsing customers.json:", parseError);
//             return res.status(500).json({ error: "Invalid customer data format." });
//         }

//         const customerIndex = customers.findIndex(c => c.id === customerId);

//         if (customerIndex === -1) {
//             return res.status(404).json({ error: "Customer not found." });
//         }

//         const customer = customers[customerIndex];

//         if (!customer.logos) {
//             customer.logos = [];
//         }

//         // 2. Update customers.json to store full logo details
//         const newLogoEntry = {
//             logoUrl: logoImageUrl,
//             logoName: logoName || "No Name", // Default to "No Name" if empty
//             logoPosition: logoPosition || "Unspecified", // Default to "Unspecified" if empty
//             logoType: logoType || "", // Default to empty string if empty
//             threadNumbers: threadNumbers // Array of thread numbers
//         };
//         customer.logos.push(newLogoEntry);

//         customers[customerIndex] = customer;

//         fs.writeFile(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), "utf8", (err) => {
//             if (err) {
//                 console.error("Error writing to customers.json:", err);
//                 return res.status(500).json({ error: "Failed to update customer data." });
//             }
//             res.json({ message: "Customer logo updated successfully with details.", customer: customer, logoDetails: newLogoEntry }); // Send back full logo details in response
//             console.log(`Customer ID ${customerId} logo updated with details:`, newLogoEntry);
//             generateCustomerPages();
//         });
//     });
// });

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

// server.js (Add this new block)

app.put("/api/customers/:customerId/generate-proof", async (req, res) => {
    const customerId = Number(req.params.customerId);
    const proofData = req.body;
    console.log("SERVER RECEIVED proofData:", proofData);

    const templatePath = path.join(__dirname, 'src', 'pages', 'proof_template.html');
    let templateHtml;
    try {
        templateHtml = fs.readFileSync(templatePath, 'utf-8');
    } catch (readError) {
        console.error("Error reading proof_template.html:", readError);
        return res.status(500).json({ error: 'Failed to read proof template file.' });
    }

    // --- Base64 Encode the Company Logo ---
    let logoBase64 = '';
    try {
        const imagePath = path.join(__dirname, 'src', 'pages', 'images', 'company_logo.png');
        const imageBuffer = fs.readFileSync(imagePath);
        logoBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    } catch (imageError) {
        console.error("Error reading or encoding company logo:", imageError);
        // You might want to handle this more gracefully, perhaps with a default image
        // return res.status(500).json({ error: 'Failed to load company logo.' }); // Or use a default
    }


    let populatedHtml = templateHtml;
    populatedHtml = populatedHtml.replace(/\[GARMENT_CODE\]/g, proofData.garmentCode || 'N/A');
    populatedHtml = populatedHtml.replace(/\[PROOF_DESCRIPTION\]/g, proofData.proofDescription || 'N/A');

    // --- Replace Logo Placeholder with Base64 Data ---
    populatedHtml = populatedHtml.replace('<img src="images/company_logo.png" alt="Company Logo">', `<img src="${logoBase64}" alt="Company Logo">`);

    const canvasImageTags = [];
    if (proofData.canvasDataURLs && proofData.canvasDataURLs.length > 0) {
        for (let i = 0; i < proofData.canvasDataURLs.length; i++) {
            const dataURL = proofData.canvasDataURLs[i];
            if (dataURL) {
                canvasImageTags.push(`<img src="${dataURL}" alt="Proof Image ${i + 1}" style="max-width: 100%; height: auto; object-fit: contain;">`);
            } else {
                canvasImageTags.push(`<p>No Proof Image ${i + 1}.</p>`);
            }
        }
    }

    populatedHtml = populatedHtml.replace(/<!-- Proof Image 1 Placeholder -->/, canvasImageTags[0] || '<p>No Proof Image 1</p>');
    populatedHtml = populatedHtml.replace(/<!-- Proof Image 2 Placeholder -->/, canvasImageTags[1] || '<p>No Proof Image 2</p>');
    populatedHtml = populatedHtml.replace(/<!-- Proof Image 3 Placeholder -->/, canvasImageTags[2] || '<p>No Proof Image 3</p>');

    // 1. Generate a Unique Filename for the Proof - MODIFIED FILENAME GENERATION
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const dateString = date.toISOString().replace(/[-:]/g, '').slice(0, 15); // Format: YYYYMMDDTHHMMSSmmm
    const sanitizedGarmentCode = (proofData.garmentCode || 'N_A').replace(/[^a-zA-Z0-9]/g, "_"); // Replace non-alphanumeric chars with underscores, default to 'N_A' if null/undefined
    const sanitizedDescription = (proofData.proofDescription || '').replace(/[^a-zA-Z0-9\s]/g, "_"); // Replace non-alphanumeric and non-space chars, default to empty string if null/undefined

    const proofFilename = `proof-${sanitizedGarmentCode}-${sanitizedDescription}-${dateString}.pdf`; // Filename format: proof-GARMENTCODE-DESCRIPTION-DATESTAMP.pdf
    const proofFilePath = path.join(__dirname, 'src', 'pages', 'customer_proofs', proofFilename); // Full path to save PDF
    const proofUrl = `/customer_proofs/${proofFilename}`; // URL to access the file
  
  
    let pdfBuffer;
    try {
        const options = { format: 'A4', landscape: true };
        const file = { content: populatedHtml };
        pdfBuffer = await pdf.generatePdf(file, options);
        // 2. Save the PDF buffer to customer_proofs folder
        fs.writeFile(proofFilePath, pdfBuffer, (writeFileError) => {
            if (writeFileError) {
                console.error('Error saving PDF to disk:', writeFileError);
                // IMPORTANT: We must return an error response here if saving fails
                return res.status(500).json({ error: 'Failed to save PDF to disk.' });
            }
            console.log('PDF saved successfully:', proofFilePath);
          
          // 3. Update customers.json
                      const customersFilePath = path.join(__dirname, 'customers.json');
            fs.readFile(customersFilePath, 'utf8', (readCustomerErr, customersData) => {
                if (readCustomerErr) {
                    console.error('Error reading customers.json:', readCustomerErr);
                    return res.status(500).json({ error: 'Failed to read customer data.' });
                }

                let customers;
                try {
                    customers = JSON.parse(customersData);
                } catch (parseCustomerError) {
                    console.error('Error parsing customers.json:', parseCustomerError);
                    return res.status(500).json({ error: 'Failed to parse customer data.' });
                }

                const customerIndex = customers.findIndex(c => c.id === customerId);
                if (customerIndex === -1) {
                    return res.status(404).json({ error: 'Customer not found in data.' });
                }
              
                const logoNames = proofData.logoNames; // Get logo names from proofData

                const newProof = {
                    url: proofUrl,
                    garmentCode: proofData.garmentCode,
                    logo: logoNames, // For now, as discussed
                    logoPosition: 'Left Breast', // For now, as discussed
                    description: proofData.proofDescription || ''
                };

                if (!customers[customerIndex].proofs) {
                    customers[customerIndex].proofs = [];
                }
                customers[customerIndex].proofs.push(newProof);

                fs.writeFile(customersFilePath, JSON.stringify(customers, null, 2), 'utf8', (writeCustomerErr) => {
                    if (writeCustomerErr) {
                        console.error('Error writing to customers.json:', writeCustomerErr);
                        return res.status(500).json({ error: 'Failed to update customer data.' });
                    }

                    // 4. Send JSON response back to client
                    res.json({ message: 'PDF Proof generated and saved successfully!', proofUrl: proofUrl });
                });
            });
            
      
        });
      
      
    } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        return res.status(500).json({ error: 'Failed to generate PDF.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proofFilename}"`);
    res.send(pdfBuffer);
});


app.get("/api/garments", (req, res) => {
    fs.readFile(garmentCataloguePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading garment_catalogue.json:", err);
            return res.status(500).json({ error: "Failed to read garment catalogue data." });
        }
        try {
            const garments = JSON.parse(data);
            res.json(garments);
        } catch (parseError) {
            console.error("Error parsing garment_catalogue.json:", parseError);
            res.status(500).json({ error: "Invalid garment catalogue data format." });
        }
    });
});


app.get("/api/colourway-names", (req, res) => {
    const colourwayNamesPath = path.join(__dirname, 'colourway_names.json'); // Path to your JSON file

    fs.readFile(colourwayNamesPath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading colourway_names.json:", err);
            return res.status(500).json({ error: "Failed to read colourway names data." });
        }
        try {
            const colourwayNames = JSON.parse(data);
            res.json(colourwayNames);
        } catch (parseError) {
            console.error("Error parsing colourway_names.json:", parseError);
            res.status(500).json({ error: "Invalid colourway names data format." });
        }
    });
});

app.get('/image-check', async (req, res) => {
    const imageUrl = req.query.url;
    console.log("Proxy received request for URL:", imageUrl); // Log received URL

    if (!imageUrl) {
        console.log("Error: Missing URL parameter"); // Log missing URL error
        return res.status(400).send('Missing URL parameter');
    }

    try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        console.log("Proxy fetched URL, status code:", response.status); // Log status code from fetch
        res.status(response.status).send();
    } catch (error) {
        console.error('Proxy error during fetch:', error); // Log full fetch error
        res.status(500).send('Proxy error');
    }
});

// Proxy route for garment images
app.get('/garment-image-proxy', (req, res) => {
    const imageUrl = req.query.imageUrl; // Get the image URL from the query parameter

    if (!imageUrl) {
        return res.status(400).send('imageUrl parameter is required');
    }

    request.get({
        url: imageUrl,
        encoding: null // Important to handle binary data (images)
    }, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            console.error('Proxy request error:', error || `Status code: ${response.statusCode}`);
            return res.status(500).send('Proxy request failed');
        }

        res.set('Content-Type', response.headers['content-type']); // Set the correct Content-Type
        res.set('Access-Control-Allow-Origin', '*'); // Optional, but good practice for CORS
        res.send(body); // Send the image data back to the client
    });
});



// --- NEW API Endpoint: Handle CSV Upload for Orders ---
app.post('/api/upload-orders', express.text({ type: 'text/csv' }), (req, res) => {
    const csvText = req.body;
    const results = [];
    const filePath = path.join(__dirname, 'active_jobs.json'); // Path to active_jobs.json
    let existingJobsData = {}; // To store existing jobs data (initially empty)

    // --- Load existing active_jobs.json data FIRST ---
    fs.readFile(filePath, 'utf8', (readErr, existingData) => {
        if (!readErr) { // No error means file exists and was read
            try {
                existingJobsData = JSON.parse(existingData);
                console.log('Existing active_jobs.json data loaded.');
            } catch (parseError) {
                console.error('Error parsing existing active_jobs.json:', parseError);
                // If parsing fails, we'll start with an empty object
                existingJobsData = {};
            }
        } else if (readErr.code === 'ENOENT') {
            console.log('active_jobs.json not found, starting fresh.');
            // It's okay if the file doesn't exist yet (first time upload)
        } else {
            console.error('Error reading active_jobs.json:', readErr);
            return res.status(500).json({ error: 'Failed to read existing active order data.' });
        }

        const stream = require('stream').Readable.from(csvText);

        stream
            .pipe(csvParser({
                headers: [
                    "OUR_REFERENCE", "A/C", "Trader Name", "Product Code",
                    "Product Description", "Product Pack Size", "Ordered Qty",
                    "Outstanding Qty", "Total Price", "Total Cost", "Order Date",
                    "Item Due Date", "SWP Parts", "Other Parts", "Reference",
                    "Contact", "Rep", "Address",
                    "SWP Parts Desc", "Other Parts Desc" //  NEW HEADERS
                ]
            }))
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', () => {
                console.log('CSV data parsed on server, starting consolidation and update...');

                const consolidatedOrders = {}; // Object to hold consolidated orders (NEW OBJECT EACH TIME)
                const updatedJobsData = { ...existingJobsData }; // Clone existing data to update - IMPORTANT

                results.forEach(row => {
                    const sord = row.OUR_REFERENCE;

                    if (!consolidatedOrders[sord]) {
                        consolidatedOrders[sord] = {
                            SORD: sord,
                            "Trader Code": row["A/C"],
                            "Trader Name": row["Trader Name"],
                            "Total Items": 0, // Initialize.  We'll sum this later.
                            "Item List": [],  // Initialize the Item List array!
                            "Ordered Date": null,  // Initialize.  We'll check for earliest date.
                            "Due Date": null,     // Initialize.  We'll check for earliest date.
                            "Total Logos": 0,      // Initialize. We'll sum this later.
                            "Reference": row.Reference, // Add other fields
                            "Contact": row.Contact,
                            "Rep": row.Rep,
                            "Address": row.Address
                        };
                    }

                    let masterCode = row["Product Code"].trim();  // Use trim() to remove potential whitespace
                    if (masterCode) { // Only process if masterCode is not empty

                        // 1. Find existing item in Item List (if any) with this Master Code
                        let existingItem = consolidatedOrders[sord]["Item List"].find(item => item["Master Code"] === masterCode);

                        // 2. If no existing item, create a new one!
                        if (!existingItem) {
                            existingItem = {
                                "Master Code": masterCode,
                                "Description": row["Product Description"],
                                "Ordered Qty": 0,  // Initialize - we'll sum up below
                                "Outstanding Qty": 0, // Initialize
                                "SWP Parts": [],    // Initialize as empty array
                                "Other Parts": [],    // Initialize as empty array
                                "SWP Parts Desc": [],  // NEW: Array for SWP Parts descriptions
                                "Other Parts Desc": [] // NEW: Array for Other Parts descriptions
                            };
                            consolidatedOrders[sord]["Item List"].push(existingItem);
                        }

                        // 3. Update the existing (or newly created) item:
                        existingItem["Ordered Qty"] += parseInt(row["Ordered Qty"] || 0, 10);
                        existingItem["Outstanding Qty"] += parseInt(row["Outstanding Qty"] || 0, 10);

                         // --- SWP Parts and Descriptions ---
                        const swpParts = row["SWP Parts"] ? row["SWP Parts"].split(',').map(part => part.trim()).filter(part => part !== "") : [];
                        const swpPartsDesc = row["SWP Parts Desc"] ? row["SWP Parts Desc"].split(',').map(desc => desc.trim()).filter(desc => desc !== "") : [];

                        // IMPORTANT: Handle cases where the number of parts and descriptions don't match
                        if (swpParts.length !== swpPartsDesc.length) {
                            console.warn(`Mismatch in SWP Parts and Descriptions for SORD ${sord}, Master Code ${masterCode}. Parts: ${swpParts.join(',')}, Descriptions: ${swpPartsDesc.join(',')}`);
                            // Pad the shorter array with empty strings.
                            const maxLength = Math.max(swpParts.length, swpPartsDesc.length);
                            while (swpParts.length < maxLength) swpParts.push("");
                            while (swpPartsDesc.length < maxLength) swpPartsDesc.push("");
                        }

                        existingItem["SWP Parts"].push(...swpParts); // Use spread operator to add to the array
                        existingItem["SWP Parts Desc"].push(...swpPartsDesc); // Use spread operator
                        consolidatedOrders[sord]["Total Logos"] += swpParts.length; // Count logos


                        // --- Other Parts and Descriptions ---
                        const otherParts = row["Other Parts"] ? row["Other Parts"].split(',').map(part => part.trim()).filter(part => part !== "") : [];
                        const otherPartsDesc = row["Other Parts Desc"] ? row["Other Parts Desc"].split(',').map(desc => desc.trim()).filter(desc => desc !== "") : [];

                        // IMPORTANT: Handle cases where the number of parts and descriptions don't match
                        if (otherParts.length !== otherPartsDesc.length) {
                          console.warn(`Mismatch in Other Parts and Descriptions for SORD ${sord}, Master Code ${masterCode}. Parts: ${otherParts.join(',')}, Descriptions: ${otherPartsDesc.join(',')}`);
                            const maxLength = Math.max(otherParts.length, otherPartsDesc.length);
                          while (otherParts.length < maxLength) otherParts.push("");
                          while (otherPartsDesc.length < maxLength) otherPartsDesc.push("");
                        }
                        existingItem["Other Parts"].push(...otherParts); // Use spread operator to add to the array
                        existingItem["Other Parts Desc"].push(...otherPartsDesc); // Use spread operator

                        // --- (Rest of your consolidation logic - Date handling, etc.) ---

                        // 5.  Update the Total Items (across ALL items for the SORD)
                        consolidatedOrders[sord]["Total Items"] += parseInt(row["Outstanding Qty"] || 0, 10);

                        const orderDate = parseExcelDate(row["Order Date"]);
                        const dueDate = parseExcelDate(row["Item Due Date"]);

                        if (orderDate) {
                            const existingOrderDate = consolidatedOrders[sord]["Ordered Date"] ? parseExcelDate(consolidatedOrders[sord]["Ordered Date"]) : null;
                            if (!existingOrderDate || orderDate < existingOrderDate) {
                                consolidatedOrders[sord]["Ordered Date"] = formatDate(orderDate);
                            }
                        }
                        if (dueDate) {
                            const existingDueDate = consolidatedOrders[sord]["Due Date"] ? parseExcelDate(consolidatedOrders[sord]["Due Date"]) : null;
                            if (!existingDueDate || dueDate < existingDueDate) {
                                consolidatedOrders[sord]["Due Date"] = formatDate(dueDate);
                            }
                        }
                    }
                });

                // Merge new data with existing data, and convert to array:
                const updatedJobsArray = Object.values(Object.assign({}, existingJobsData, consolidatedOrders));

                console.log('CSV data consolidated and merged with existing data.');

                updateActiveJobsJSON(updatedJobsArray); // Save as JSON array
                res.json(updatedJobsArray); // Send JSON array to client

            })
            .on('error', (error) => {
                console.error('CSV parsing error on server:', error);
                res.status(500).json({ error: 'Failed to parse CSV data on server.' });
            });
    });
});

// --- Helper function to write data to active_jobs.json ---
function updateActiveJobsJSON(jobsData) {
    const filePath = path.join(__dirname, 'active_jobs.json'); // Path to active_jobs.json

    fs.writeFile(filePath, JSON.stringify(jobsData, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Error writing to active_jobs.json:", err);
        } else {
            console.log("Successfully updated active_jobs.json");
        }
    });
}

// --- NEW API Endpoint: Get Active Orders Data ---
app.get('/api/active-orders', (req, res) => {
    const filePath = path.join(__dirname, 'active_jobs.json'); // Path to active_jobs.json

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading active_jobs.json:", err);
            return res.status(500).json({ error: 'Failed to read active order data.' });
        }

        try {
            const jobsData = JSON.parse(data);
            console.log('Active order data read from JSON and sent to client.'); // Log server-side read
            res.json(jobsData); // Send the JSON data back to the client

        } catch (parseError) {
            console.error("Error parsing active_jobs.json:", parseError);
            return res.status(500).json({ error: 'Error parsing active order data.' });
        }
    });
});


// --- Helper function to parse Excel date format and DD/MM/YY format ---
// --- Helper function to parse DD/MM/YYYY date format ---
function parseExcelDate(dateString) {
    if (!dateString) {
        return null; // Handle empty or null values
    }

    // Check if the dateString matches the YYYY-MM-DD format using a regular expression
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      console.warn(`Invalid date format: ${dateString}`);
      return null; // Handle invalid format
    }

    const [year, month, day] = dateString.split('-').map(Number);

    // Month is 0-indexed in JavaScript Date
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (isNaN(parsedDate)) {
        console.warn(`Invalid date: ${dateString}`);
        return null;
    }

    return parsedDate;
}

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});