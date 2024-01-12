const router = require("express").Router({ mergeParams: true });
const {
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
    bulkReviews,
} = require("../controller/reviews");

const Review = require("../models/Review");
const advancedResults = require("../middleware/advancedResults");

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(
    advancedResults(Review, {
        path: "product",
        select: "name",
    }),
    getReviews
);

router
    .route("/:id")
    .get(getReview)
    .put(protect, updateReview)
    .delete(protect, deleteReview);

router.route("/bulk").post(protect, bulkReviews);

module.exports = router;
