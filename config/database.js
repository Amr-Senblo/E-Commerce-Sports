const mongoose = require("mongoose");
const dbConnection = async () => {
  try {
    const uri = process.env.DATABASE_CONNECTION_STRING?.replace(
      "<password>",
      process.env.DB_PASSWORD
    );
    if (!uri) {
      throw new Error("DATABASE_CONNECTION_STRING is not defined");
    }

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database connection successful");
    return conn;
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;
  }
};
module.exports = dbConnection;
