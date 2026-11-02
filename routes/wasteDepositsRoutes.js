const express = require("express");
const router = express.Router();

const controller = require("../controllers/wasteDepositsController");
const cekApiKey = require("../middlewares/cekApiKey");
const asyncHandler = require("../middlewares/asyncHandler");

// GET dapat diakses tanpa API key; operasi perubahan data memerlukan API key.
router.get("/", asyncHandler(controller.getAllWasteDeposits));
router.get("/:id", asyncHandler(controller.getWasteDepositById));
router.post("/", cekApiKey, asyncHandler(controller.createWasteDeposit));
router.put("/:id", cekApiKey, asyncHandler(controller.updateWasteDeposit));
router.delete("/:id", cekApiKey, asyncHandler(controller.deleteWasteDeposit));

module.exports = router;
