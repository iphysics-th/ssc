// import.js (Corrected for DB and Collection names)

const dbName = 'universityReservation'; // <-- Corrected
const collectionName = 'subjects';        // <-- Corrected
const jsonFilePath = './chemistry.json';

// --- Script Starts Here ---

console.log("Starting the import script...");

// Select the database
db = db.getSiblingDB(dbName);

// Read and parse the JSON file
let data;
try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
    data = JSON.parse(fileContent);
    if (!Array.isArray(data)) {
        throw new Error("JSON file is not an array. Wrapping it in an array.");
    }
} catch (e) {
    if (e.message.includes("JSON file is not an array")) {
        const fileContent = fs.readFileSync(jsonFilePath, 'utf8');
        data = [JSON.parse(fileContent)];
        console.log("Successfully read a single JSON object and wrapped it in an array.");
    } else {
        console.error(`Error reading or parsing ${jsonFilePath}: ${e.message}`);
        quit(1);
    }
}


console.log(`Found ${data.length} documents in the JSON file.`);

// Iterate over each document and perform an upsert operation
data.forEach(doc => {
    if (!doc.code) {
        console.log("Skipping a document because it does not have a 'code' field:", doc);
        return;
    }
    
    // Remove the _id field from the document before updating
    delete doc._id; 

    const filter = { code: doc.code };
    const update = { $set: doc };
    const options = { upsert: true };

    try {
        const result = db[collectionName].updateOne(filter, update, options);

        if (result.upsertedCount > 0) {
            console.log(`Inserted new document with code: ${doc.code}`);
        } else if (result.matchedCount > 0) {
            console.log(`Updated existing document with code: ${doc.code}`);
        } else {
            console.log(`Document with code ${doc.code} already exists and is up-to-date.`);
        }
    } catch (e) {
        console.error(`Failed to process document with code ${doc.code}: ${e.message}`);
    }
});

console.log("Script finished.");