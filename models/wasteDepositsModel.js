const mongoose = require("mongoose");

const wasteDepositSchema = new mongoose.Schema({
  // Referencing: dokumen setoran menyimpan ObjectId Nasabah.
  nasabah: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Nasabah",
    required: [true, "nasabah wajib diisi"]
  },
  jenisSampah: {
    type: String,
    enum: ["plastik", "kertas", "logam", "kaca"],
    required: [true, "jenisSampah wajib diisi"],
    lowercase: true,
    trim: true
  },
  beratKg: {
    type: Number,
    required: [true, "beratKg wajib diisi"],
    min: [0.01, "beratKg harus lebih dari 0"]
  },
  hargaPerKg: {
    type: Number,
    required: [true, "hargaPerKg wajib diisi"],
    min: [0.01, "hargaPerKg harus lebih dari 0"]
  },
  tanggalSetor: {
    type: Date,
    required: [true, "tanggalSetor wajib diisi"]
  }
}, { timestamps: true });

module.exports = mongoose.model("WasteDeposit", wasteDepositSchema);
