const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const AppError = require("./utils/appError");

// Load env BEFORE importing routes/middlewares that use them
dotenv.config({
    path: "./config.env",
});

const categoryRoute = require("./routes/categoryRoute");
const productRoute = require("./routes/productRoute");
const subCategoryRoute = require("./routes/subCategoryRoute");

const { globalError, handleUnhandledRejection } = require("./middlewares/errorMiddleware");

const app = express();


//  [1] MIDDLEWARES
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(process.env.NODE_ENV, "Morgan logger enabled.");
}



//  [2] ROUTES
app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/subCategories", subCategoryRoute)




app.all("*", (req, res, next) => {
  next(new AppError(`Sorry, Might be an error in the URL: ${req.originalUrl}`, 404));
});


//  [3] GLOBAL ERROR HANDLER
app.use(globalError);

//  [4] UNHANDLED REJECTION
process.on("unhandledRejection", handleUnhandledRejection);


module.exports = app;