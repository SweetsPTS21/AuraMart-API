const router = require("express").Router();
const {
    sendBuildRecommendation,
    getRecommendation,
    checkCachedRecommend,
    getCommonRecommendation,
    checkCachedCommonRecommend,
} = require("../controller/recommend");

const { protect, authorize } = require("../middleware/auth");

router
    .route("/build")
    .post(protect, authorize("admin"), sendBuildRecommendation);

router
    .route("/common")
    .get(checkCachedCommonRecommend, getCommonRecommendation);

router.route("/user/:userId").get(checkCachedRecommend, getRecommendation);

module.exports = router;
