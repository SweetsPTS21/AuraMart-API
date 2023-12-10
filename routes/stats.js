const router = require("express").Router({ mergeParams: true });
const {
    getTopSoldProduct,
    getTopSoldOfShop,
    getShopStatistic,
} = require("../controller/stats");

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(protect, authorize("admin"), getTopSoldOfShop);
router.route("/products").get(getTopSoldProduct);
router.route("/statistics").get(getShopStatistic);

module.exports = router;
