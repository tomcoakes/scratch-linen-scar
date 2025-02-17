// ingest_job_data.js (Simplified for manual CSV upload)

const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

async function ingestJobData() {
    console.log("Starting job data ingestion from local CSV...");

    const activeJobsPath = path.join(__dirname, 'active_jobs.json');
    const csvFilePath = path.join(__dirname, 'active_jobs_report.csv'); // CSV in project root


    try {
        console.log(`Parsing CSV from local file: ${csvFilePath} and converting to JSON...`);
        const jobs = [];

        fs.createReadStream(csvFilePath)
            .pipe(csvParser())
            .on('data', (row) => {
                jobs.push(row); // For now, just push each row as-is
            })
            .on('end', () => {
                fs.writeFile(activeJobsPath, JSON.stringify(jobs, null, 2), (err) => {
                    if (err) {
                        console.error("Error writing active_jobs.json:", err);
                    } else {
                        console.log(`Successfully converted ${jobs.length} job records and saved to active_jobs.json`);
                    }
                });
            });

        console.log("Job data ingestion from local CSV COMPLETED!");

    } catch (error) {
        console.error("Error during job data ingestion:", error);
        console.error("Make sure active_jobs_report.csv is in the same directory as the script.");
    }
}

ingestJobData();