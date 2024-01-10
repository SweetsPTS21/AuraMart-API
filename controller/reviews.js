const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const redis = require("redis");
const Ratings = require("../models/Ratings");

const redis_client = redis.createClient({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});
// @desc    Get all reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res, next) => {
    return res.status(200).json(res.advancedResults);
});

// @desc    Get all reviews of a product
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId }).populate({
        path: "user",
        select: "name",
    });

    // Cache the result in Redis for 1 hour to improve performance
    redis_client.setex(
        `reviews_product:${productId}`,
        process.env.CACHE_EXPIRE || 3600,
        JSON.stringify(reviews)
    );

    return res.status(200).json({
        success: true,
        total: reviews.length,
        data: reviews,
    });
});

// @dest   Get all user reviews
// @route  GET /api/v1/users/:userId/reviews
// @access Private
const getUserReviews = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const reviews = await Review.find({ user: userId })
        .populate({
            path: "product",
            select: "name photo",
        })
        .populate({
            path: "user",
            select: "name",
        });

    return res.status(200).json({
        success: true,
        total: reviews.length,
        data: reviews,
    });
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
const getReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
        path: "product",
        select: "name",
    });

    if (!review) {
        return next(
            new ErrorResponse(`No review found with id ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: review,
    });
});

// @desc    Add review
// @route   POST /api/v1/products/:productId/reviews
// @access  Private. One user can create only 1 review
const addReview = asyncHandler(async (req, res, next) => {
    req.body.product = req.params.productId;
    req.body.user = req.user.id;

    const product = await Product.findById(req.params.productId);

    if (!product) {
        return next(
            new ErrorResponse(`No product with id ${req.params.productId}`, 404)
        );
    }

    // Check if the user has already reviewed the product
    const existingReview = await Review.findOne({
        product: req.params.productId,
        user: req.user.id,
    });

    if (existingReview) {
        return next(
            new ErrorResponse(
                `The user with ID ${req.user.id} has already reviewed the product with ID ${req.params.productId}`,
                400
            )
        );
    }

    // Check if the user has already bought the product
    const existingOrder = await Order.findOne({
        user: req.user.id,
        product: req.params.productId,
    });

    if (!existingOrder) {
        return next(
            new ErrorResponse(
                `The user with ID ${req.user.id} has not bought the product with ID ${req.params.productId}`,
                400
            )
        );
    }

    // Add the review to the ratings collection
    const rating = await Ratings.create({
        rating: req.body.rating,
        product: req.params.productId,
        user: req.user.id,
        createdAt: Math.floor(Date.now() / 1000),
    });

    const review = await Review.create(req.body);

    res.status(201).json({
        success: true,
        data: review,
        rating: rating,
    });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res, next) => {
    let review = await Review.findById(req.params.id);

    if (!review) {
        return next(
            new ErrorResponse(`No review found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the review
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(`This user cannot update this review`, 401)
        );
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: review,
    });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(
            new ErrorResponse(`No review found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the review
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(`This user cannot update this review`, 401)
        );
    }

    await review.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

module.exports = {
    getReviews,
    getProductReviews,
    getUserReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
};
