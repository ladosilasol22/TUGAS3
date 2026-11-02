function cekApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!process.env.API_KEY || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: "API key tidak valid atau belum dikirim"
    });
  }

  next();
}

module.exports = cekApiKey;
