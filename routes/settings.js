const router = require("express").Router();

const { getRecommendedLogs, clearLogs } = require("../controller/settings");

const { protect, authorize } = require("../middleware/auth");

router
    .route("/logs")
    .get(protect, authorize("admin"), getRecommendedLogs)
    .delete(protect, authorize("admin"), clearLogs);

router.route("/build").get(protect, authorize("admin"), getRecommendedLogs);

module.exports = router;
