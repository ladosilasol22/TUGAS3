const mongoose = require("mongoose");
const WasteDeposit = require("../models/wasteDepositsModel");
const Nasabah = require("../models/nasabahModel");
const { errorHttp } = require("../middlewares/errorHandler");

const JENIS_SAMPAH = ["plastik", "kertas", "logam", "kaca"];
const SORT_FIELDS = ["tanggalSetor", "beratKg", "hargaPerKg", "jenisSampah", "createdAt"];
const SELECT_FIELDS = ["nasabah", "jenisSampah", "beratKg", "hargaPerKg", "tanggalSetor", "createdAt", "updatedAt"];

function safeInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function validateId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw errorHttp(400, "Format ID tidak valid");
  }
}

// GET utama: filtering, pagination, sorting, projection, dan populate.
exports.getAllWasteDeposits = async (req, res) => {
  const filter = {};

  if (req.query.jenisSampah) {
    const jenis = String(req.query.jenisSampah).toLowerCase();
    if (!JENIS_SAMPAH.includes(jenis)) {
      throw errorHttp(400, `jenisSampah hanya boleh: ${JENIS_SAMPAH.join(", ")}`);
    }
    filter.jenisSampah = jenis;
  }

  if (req.query.nasabahId) {
    validateId(String(req.query.nasabahId));
    filter.nasabah = req.query.nasabahId;
  }

  if (req.query.dari || req.query.sampai) {
    filter.tanggalSetor = {};
    if (req.query.dari) {
      const dari = new Date(req.query.dari);
      if (Number.isNaN(dari.getTime())) throw errorHttp(400, "Format parameter dari harus berupa tanggal yang valid");
      filter.tanggalSetor.$gte = dari;
    }
    if (req.query.sampai) {
      const sampai = new Date(req.query.sampai);
      if (Number.isNaN(sampai.getTime())) throw errorHttp(400, "Format parameter sampai harus berupa tanggal yang valid");
      filter.tanggalSetor.$lte = sampai;
    }
  }

  const page = safeInteger(req.query.page, 1, 1, 1000000);
  const limit = safeInteger(req.query.limit, 10, 1, 100);
  const sortParam = String(req.query.sort || "-tanggalSetor");
  const sortField = sortParam.startsWith("-") ? sortParam.slice(1) : sortParam;
  if (!SORT_FIELDS.includes(sortField)) {
    throw errorHttp(400, `sort hanya boleh: ${SORT_FIELDS.join(", ")} atau awali dengan tanda - untuk urutan menurun`);
  }
  const sortDirection = sortParam.startsWith("-") ? -1 : 1;

  let projection = "";
  if (req.query.fields) {
    const fields = String(req.query.fields).split(",").map((field) => field.trim()).filter(Boolean);
    if (!fields.length || !fields.every((field) => SELECT_FIELDS.includes(field))) {
      throw errorHttp(400, `fields hanya boleh: ${SELECT_FIELDS.join(", ")}`);
    }
    projection = fields.join(" ");
  }

  const query = WasteDeposit.find(filter)
    .select(projection)
    .populate("nasabah", "namaNasabah alamat noTelepon")
    .sort({ [sortField]: sortDirection, _id: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [data, total] = await Promise.all([
    query,
    WasteDeposit.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    query: {
      jenisSampah: req.query.jenisSampah || null,
      nasabahId: req.query.nasabahId || null,
      sort: sortParam,
      fields: req.query.fields || "semua"
    },
    data
  });
};

exports.getWasteDepositById = async (req, res) => {
  validateId(req.params.id);
  const data = await WasteDeposit.findById(req.params.id)
    .populate("nasabah", "namaNasabah alamat noTelepon");
  if (!data) throw errorHttp(404, "Data setoran tidak ditemukan");
  res.status(200).json({ success: true, data });
};

exports.createWasteDeposit = async (req, res) => {
  const { namaNasabah, alamat, noTelepon, jenisSampah, beratKg, hargaPerKg, tanggalSetor } = req.body;

  if (!namaNasabah || !jenisSampah || beratKg === undefined || hargaPerKg === undefined || !tanggalSetor) {
    throw errorHttp(400, "namaNasabah, jenisSampah, beratKg, hargaPerKg, dan tanggalSetor wajib diisi");
  }
  if (!JENIS_SAMPAH.includes(String(jenisSampah).toLowerCase())) {
    throw errorHttp(400, `jenisSampah hanya boleh: ${JENIS_SAMPAH.join(", ")}`);
  }
  if (!Number.isFinite(Number(beratKg)) || Number(beratKg) <= 0 ||
      !Number.isFinite(Number(hargaPerKg)) || Number(hargaPerKg) <= 0) {
    throw errorHttp(400, "beratKg dan hargaPerKg harus berupa angka lebih dari 0");
  }
  if (Number.isNaN(new Date(tanggalSetor).getTime())) {
    throw errorHttp(400, "tanggalSetor harus berupa tanggal yang valid");
  }

  const nasabah = await Nasabah.create({ namaNasabah, alamat, noTelepon });
  try {
    const data = await WasteDeposit.create({
      nasabah: nasabah._id,
      jenisSampah: String(jenisSampah).toLowerCase(),
      beratKg: Number(beratKg),
      hargaPerKg: Number(hargaPerKg),
      tanggalSetor
    });
    await data.populate("nasabah", "namaNasabah alamat noTelepon");
    res.status(201).json({ success: true, message: "Data setoran berhasil ditambahkan", data });
  } catch (err) {
    await Nasabah.findByIdAndDelete(nasabah._id);
    throw err;
  }
};

exports.updateWasteDeposit = async (req, res) => {
  validateId(req.params.id);
  const data = await WasteDeposit.findById(req.params.id);
  if (!data) throw errorHttp(404, "Data setoran tidak ditemukan");

  const { namaNasabah, alamat, noTelepon, jenisSampah, beratKg, hargaPerKg, tanggalSetor } = req.body;

  if (jenisSampah !== undefined && !JENIS_SAMPAH.includes(String(jenisSampah).toLowerCase())) {
    throw errorHttp(400, `jenisSampah hanya boleh: ${JENIS_SAMPAH.join(", ")}`);
  }
  if (beratKg !== undefined && (!Number.isFinite(Number(beratKg)) || Number(beratKg) <= 0)) {
    throw errorHttp(400, "beratKg harus berupa angka lebih dari 0");
  }
  if (hargaPerKg !== undefined && (!Number.isFinite(Number(hargaPerKg)) || Number(hargaPerKg) <= 0)) {
    throw errorHttp(400, "hargaPerKg harus berupa angka lebih dari 0");
  }
  if (tanggalSetor !== undefined && Number.isNaN(new Date(tanggalSetor).getTime())) {
    throw errorHttp(400, "tanggalSetor harus berupa tanggal yang valid");
  }

  if (namaNasabah !== undefined || alamat !== undefined || noTelepon !== undefined) {
    const updateNasabah = {};
    if (namaNasabah !== undefined) updateNasabah.namaNasabah = namaNasabah;
    if (alamat !== undefined) updateNasabah.alamat = alamat;
    if (noTelepon !== undefined) updateNasabah.noTelepon = noTelepon;
    await Nasabah.findByIdAndUpdate(data.nasabah, updateNasabah, { runValidators: true });
  }

  if (jenisSampah !== undefined) data.jenisSampah = String(jenisSampah).toLowerCase();
  if (beratKg !== undefined) data.beratKg = Number(beratKg);
  if (hargaPerKg !== undefined) data.hargaPerKg = Number(hargaPerKg);
  if (tanggalSetor !== undefined) data.tanggalSetor = tanggalSetor;

  await data.save();
  await data.populate("nasabah", "namaNasabah alamat noTelepon");
  res.status(200).json({ success: true, message: "Data setoran berhasil diperbarui", data });
};

exports.deleteWasteDeposit = async (req, res) => {
  validateId(req.params.id);
  const data = await WasteDeposit.findByIdAndDelete(req.params.id);
  if (!data) throw errorHttp(404, "Data setoran tidak ditemukan");

  // Nasabah dihapus jika tidak lagi dipakai setoran lain.
  const setoranLain = await WasteDeposit.exists({ nasabah: data.nasabah });
  if (!setoranLain) await Nasabah.findByIdAndDelete(data.nasabah);

  res.status(200).json({ success: true, message: "Data setoran berhasil dihapus", data });
};
