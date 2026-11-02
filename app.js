require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const logger = require("./middlewares/logger");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");
const wasteDepositsRoutes = require("./routes/wasteDepositsRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(logger);
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RESTful API Bank Sampah",
    author: "Michella Valery",
    npm: "2327240088"
  });
});

app.use("/waste-deposits", wasteDepositsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  if (!process.env.DB_URI) {
    console.error("DB_URI belum diatur. Periksa file .env.");
    process.exit(1);
  }

  mongoose.connect(process.env.DB_URI)
    .then(() => {
      console.log("Terhubung ke MongoDB");
      app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Gagal terhubung ke MongoDB:", err.message);
      process.exit(1);
    });
}

module.exports = app;
