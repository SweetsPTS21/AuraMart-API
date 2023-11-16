const router = require("express").Router();
const {
    sendBuildRecommendation,
    getRecommendation,
    checkCachedRecommend,
    checkCacheData,
} = require("../controller/recommend");

const { protect, authorize } = require("../middleware/auth");

router
    .route("/build")
    .get(protect, authorize("admin"), checkCacheData, sendBuildRecommendation);

router.route("/user/:userId").get(checkCachedRecommend, getRecommendation);

module.exports = router;
