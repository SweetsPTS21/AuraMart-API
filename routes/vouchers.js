const router = require("express").Router();
const advancedResults = require("../middleware/advancedResults");

const Voucher = require("../models/Voucher");

const { getVouchers, getVoucherByCode } = require("../controller/voucher");

router.route("/").get(advancedResults(Voucher, ["uservouchers"]), getVouchers);
router.route("/q").get(getVoucherByCode);

module.exports = router;
