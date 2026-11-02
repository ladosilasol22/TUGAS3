const mongoose = require("mongoose");

// Embedded document: alamat menjadi bagian dari dokumen Nasabah.
const alamatSchema = new mongoose.Schema({
  jalan: { type: String, trim: true },
  kota: { type: String, trim: true }
}, { _id: false });

const nasabahSchema = new mongoose.Schema({
  namaNasabah: {
    type: String,
    required: [true, "namaNasabah wajib diisi"],
    trim: true
  },
  alamat: {
    type: alamatSchema,
    default: () => ({})
  },
  noTelepon: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Nasabah", nasabahSchema);
