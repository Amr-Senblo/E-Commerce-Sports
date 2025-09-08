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

// Unhandled promise rejection handler compatible with serverless
exports.handleUnhandledRejection = (err) => {
  console.error(`Unhandled Rejection: ${err?.name}|${err?.message}`);
  // In serverless environments, avoid process.exit or server.close
  if (process.env.VERCEL) return;
  // For traditional servers, exiting is acceptable during development
  if (process.env.NODE_ENV !== "production") {
    try {
      process.exit(1);
    } catch (_) {
      // noop
    }
  }
};
