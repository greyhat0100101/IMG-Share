module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';

  if (status >= 500) console.error('💥', err);

  res.status(status).json({
    ok: false,
    error: message
  });
};
