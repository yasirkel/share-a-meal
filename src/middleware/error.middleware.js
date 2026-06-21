// Geeft een nette JSON-response terug voor onbekende routes.
function notFoundHandler(req, res) {
  res.status(404).json({
    status: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null,
  });
}

// Logt serverfouten en houdt de client-response veilig generiek.
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = error.status || 500;
  console.error(error.stack || error.message || error);

  return res.status(status).json({
    status,
    message: status === 500 ? 'Internal server error' : error.message,
    data: null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
