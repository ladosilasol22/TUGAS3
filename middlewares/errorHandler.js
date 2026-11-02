function errorHttp(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Rute ${req.method} ${req.originalUrl} tidak ditemukan`
  });
}

function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Format JSON tidak valid"
    });
  }

  if (err.name === "CastError" || err.name === "BSONError") {
    return res.status(400).json({
      success: false,
      message: "ID atau format data tidak valid"
    });
  }

  if (err.name === "ValidationError" || err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: err.code === 11000 ? "Data dengan nilai unik tersebut sudah ada" : err.message
    });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err.stack);

  res.status(status).json({
    success: false,
    message: status === 500 ? "Terjadi kesalahan pada server" : err.message
  });
}

module.exports = { errorHttp, notFoundHandler, errorHandler };
