export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 550; // Custom default or 500
  const actualStatus = statusCode >= 100 && statusCode < 600 ? statusCode : 500;
  
  // Log stack trace in development
  console.error(`[Error Handler] ${err.message || err}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(actualStatus).json({
    success: false,
    data: null,
    error: err.message || 'Internal Server Error',
  });
}
