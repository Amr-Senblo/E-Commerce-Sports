const dotenv = require("dotenv");
// Load environment variables for the serverless function runtime
dotenv.config({ path: "./config.env", debug: false });

const dbConnection = require("../config/database");
const app = require("../app");

// Ensure a single DB connection across invocations (Vercel may reuse the runtime)
let isDbConnected = false;

async function ensureDatabaseConnection() {
  if (isDbConnected) return;
  try {
    await dbConnection();
    isDbConnected = true;
  } catch (error) {
    // Re-throw to surface startup issues in logs
    throw error;
  }
}

module.exports = async (req, res) => {
  await ensureDatabaseConnection();
  return app(req, res);
};


