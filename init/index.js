const path = require("path");
require('dotenv').config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to DB");
        initDB();
    }).catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

const initDB = async () => {
    // Delete existing data
    await Listing.deleteMany({});
    
    // Add owner reference
    initData.data = initData.data.map((obj) => ({
        ...obj,
        owner: "65cd0fa5c4d3ebbc22b291db" // Keep or replace this default owner ID
    }));
    
    // Insert listings
    await Listing.insertMany(initData.data);
    console.log("data was initialized in Atlas");
    mongoose.connection.close(); // Close connection when done
}
