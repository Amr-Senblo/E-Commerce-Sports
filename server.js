
const dotenv = require("dotenv");
const app = require("./app");
const dbConnection = require("./config/database");

dotenv.config({ path: "./config.env" , debug: false});

dbConnection();





app.get("/", (req, res) => {
  res.send("Hello World");
});





exports.server = app.listen(process.env.PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
);

