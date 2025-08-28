const mongoose = require("mongoose");
const dbConnection = async () => {
  mongoose
    .connect(
      process.env.DATABASE_CONNECTION_STRING.replace(
        "<password>",
        process.env.DB_PASSWORD
      ),
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => {
      console.log("Database connection successful");
    })
    .catch((err) => {
      console.error("Database connection error:", err);
      process.exit(1);
    });
};
module.exports = dbConnection;
