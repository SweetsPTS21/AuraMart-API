const router = require("express").Router();

const {
    getRecommendedLogs,
    clearLogs,
    getBanners,
    setBanners,
} = require("../controller/settings");

const { protect, authorize } = require("../middleware/auth");

router
    .route("/logs")
    .get(protect, authorize("admin"), getRecommendedLogs)
    .delete(protect, authorize("admin"), clearLogs);

router.route("/build").get(protect, authorize("admin"), getRecommendedLogs);

router
    .route("/banners")
    .get(getBanners)
    .post(protect, authorize("admin"), setBanners);

module.exports = router;
