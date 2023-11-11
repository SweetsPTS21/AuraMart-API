const Order = require("../models/Order");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc    Get all orders
// @route   GET /api/v1/orders
// @route   GET /api/v1/shops/:shopId/orders
// @access  Public
const getOrders = asyncHandler(async (req, res, next) => {
    if (req.params.shopId) {
        let orders = await Order.find({ shop: req.params.shopId });

        return res.status(200).json({
            success: true,
            total: orders.length,
            data: orders,
        });
    } else {
        res.status(200).json(res.advancedResults);
    }
});

// @desc    Get all orders of an user
// @route   GET /api/v1/auth/:userId/orders
// @access  Private: User-Admin
const getUserOrders = asyncHandler(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 5;
    const sortBy = req.query.sort || "createdAt";

    let orders = await Order.find({ user: req.params.userId })
        .populate({
            path: "product shop",
            select: "name",
        })
        .sort("-" + sortBy)
        .limit(limit);

    req.body.user = req.user.id;

    // Allow user to get his/her history only
    if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(`Not allow to get history of other user`, 401)
        );
    }

    return res.status(200).json({
        success: true,
        total: orders.length,
        data: orders,
    });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Public
const getOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate({
        path: "product shop",
        select: "name",
    });

    if (!order) {
        return next(
            new ErrorResponse(`No order found with id ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: order,
    });
});

// @desc    Add order
// @route   POST /api/v1/checkout
// @access  Private
const addOrder = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    // const product = await Product.findById(req.body.product);

    // if (!product) {
    //   return next(
    //     new ErrorResponse(`No product with id ${req.params.productId}`, 404)
    //   );
    // }

    const order = await Order.create(req.body);

    res.status(201).json({
        success: true,
        data: order,
    });
});

// @desc    Update order
// @route   PUT /api/v1/orders/:id
// @access  Private/ User - Admin
const updateOrder = asyncHandler(async (req, res, next) => {
    let order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`No review found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the order
    if (order.user.toString() !== req.user.id && req.user.role === "user") {
        return next(
            new ErrorResponse(`This user cannot update this order`, 401)
        );
    }

    order = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: order,
    });
});

// @desc    Delete order
// @route   DELETE /api/v1/orders/:id
// @access  Private
const deleteOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`No order found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the order
    if (order.user.toString() !== req.user.id && req.user.role === "user") {
        return next(
            new ErrorResponse(`This user cannot delete this order`, 401)
        );
    }

    await order.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

module.exports = {
    getOrders,
    getUserOrders,
    getOrder,
    addOrder,
    updateOrder,
    deleteOrder,
};
