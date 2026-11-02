// Menambahkan contoh data jika koleksi masih kosong. Tidak menghapus data pengguna.
require("dotenv").config();
const mongoose = require("mongoose");
const Nasabah = require("./models/nasabahModel");
const WasteDeposit = require("./models/wasteDepositsModel");

async function main() {
  if (!process.env.DB_URI) throw new Error("DB_URI belum diatur di file .env");
  await mongoose.connect(process.env.DB_URI);

  const total = await WasteDeposit.countDocuments();
  if (total > 0) {
    console.log(`Seed dilewati: sudah ada ${total} data setoran.`);
    return;
  }

  const contoh = [
    { namaNasabah: "Andi Saputra", alamat: { jalan: "Jl. Merdeka No. 1", kota: "Palembang" }, noTelepon: "081234567801", jenisSampah: "plastik", beratKg: 2.5, hargaPerKg: 3000, tanggalSetor: "2026-10-01" },
    { namaNasabah: "Budi Santoso", alamat: { jalan: "Jl. Sudirman No. 2", kota: "Palembang" }, noTelepon: "081234567802", jenisSampah: "kertas", beratKg: 4, hargaPerKg: 2000, tanggalSetor: "2026-10-02" },
    { namaNasabah: "Citra Lestari", alamat: { jalan: "Jl. Mawar No. 3", kota: "Indralaya" }, noTelepon: "081234567803", jenisSampah: "logam", beratKg: 1.2, hargaPerKg: 8000, tanggalSetor: "2026-10-03" },
    { namaNasabah: "Dewi Anggraini", alamat: { jalan: "Jl. Melati No. 4", kota: "Palembang" }, noTelepon: "081234567804", jenisSampah: "kaca", beratKg: 3, hargaPerKg: 1500, tanggalSetor: "2026-10-04" },
    { namaNasabah: "Eko Pratama", alamat: { jalan: "Jl. Kenanga No. 5", kota: "Prabumulih" }, noTelepon: "081234567805", jenisSampah: "plastik", beratKg: 5, hargaPerKg: 3000, tanggalSetor: "2026-10-05" }
  ];

  for (const item of contoh) {
    const { namaNasabah, alamat, noTelepon, ...setoran } = item;
    const nasabah = await Nasabah.create({ namaNasabah, alamat, noTelepon });
    await WasteDeposit.create({ ...setoran, nasabah: nasabah._id });
  }

  console.log("Seed selesai: 5 data nasabah dan 5 data setoran dibuat.");
}

main()
  .catch((err) => { console.error("Seed gagal:", err.message); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
