const router = require("express").Router();
const {
    vnpayCreatePayment,
    vnpayIpn,
    vnpayQueryOrder,
    vnpayRefund,
    vnpayReturn,
} = require("../controller/vnpay");

const { momoCreatePayment, momoIpn } = require("../controller/momo");

const { protect, authorize } = require("../middleware/auth");

router
    .route("/vnpay/create")
    .post(protect, authorize("user", "seller", "admin"), vnpayCreatePayment);
router
    .route("/vnpay/vnpay_ipn")
    .get(protect, authorize("user", "seller", "admin"), vnpayIpn);

router.route("/vnpay/vnpay_return").get(vnpayReturn);

router
    .route("/vnpay/querydr")
    .get(protect, authorize("user", "seller", "admin"), vnpayQueryOrder);

router
    .route("/vnpay/refund")
    .get(protect, authorize("user", "seller", "admin"), vnpayRefund);

router
    .route("/momo/create")
    .post(protect, authorize("user", "seller", "admin"), momoCreatePayment);

router
    .route("/momo/momo_ipn")
    .get(protect, authorize("user", "seller", "admin"), momoIpn);

module.exports = router;
