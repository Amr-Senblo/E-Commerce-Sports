const { server } = require("../server");

const sendErrorForDev = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
    },
  });

const sendErrorForProd = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

// Global error handling middleware for express
exports.globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") sendErrorForDev(err, res);
  else {
    if (err.name === "JsonWebTokenError")
      err.message = "Invalid token, Please login again";
    sendErrorForProd(err, res);
  }
};

// handle rejection outside express
exports.handleUnhandledRejection = () => {
  process.on("unhandledRejection", (err) => {
    console.log(`Unhandled Regection Errors:${err.name}|${err.message}`);
    server.close(() => {
      console.error("Shutting down...");
      process.exit(1);
    });
  });
};
