const User = require("../models/User");
const Address = require("../models/Address");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const redis = require("redis");

const redis_client = redis.createClient({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});

// @desc    Get all address
// @route   GET /api/v1/address
// @route   GET /api/v1/user/:userId/address
// @access  Public
const getAllAddress = asyncHandler(async (req, res, next) => {
    return res.status(200).json(res.advancedResults);
});

// @desc    Get all address of a user
// @route   GET /api/v1/user/:userId/address
// @access  Public
const getUserAddress = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const address = await Address.find({ user: userId }).populate({
        path: "user",
        select: "name",
    });

    // Cache the result in Redis for 1 hour to improve performance
    redis_client.setex(
        `address_user:${userId}`,
        process.env.CACHE_EXPIRE || 3600,
        JSON.stringify(address)
    );

    return res.status(200).json({
        success: true,
        total: address.length,
        data: address,
    });
});

// @desc    Get single address
// @route   GET /api/v1/address/:id
// @access  Public
const getAddress = asyncHandler(async (req, res, next) => {
    const address = await Address.findById(req.params.id).populate({
        path: "user",
        select: "name",
    });

    if (!address) {
        return next(
            new ErrorResponse(`No address found with id ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: address,
    });
});

// @desc    Add address
// @route   POST /api/v1/user/:userId/address
// @access  Private. One user can create only 1 address
const addAddress = asyncHandler(async (req, res, next) => {
    req.body.user = req.params.userId;
    // req.body.address = req.address.id;

    const user = await User.findById(req.params.userId);

    if (!user) {
        return next(
            new ErrorResponse(`No user with id ${req.params.userId}`, 404)
        );
    }

    const address = await Address.create(req.body);

    res.status(201).json({
        success: true,
        data: address,
    });
});

// @desc    Update address
// @route   PUT /api/v1/address/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res, next) => {
    let address = await Address.findById(req.params.id);

    if (!address) {
        return next(
            new ErrorResponse(`No address found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the address
    if (address.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(`This user cannot update this address`, 401)
        );
    }

    address = await Address.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: address,
    });
});

// @desc    Delete address
// @route   DELETE /api/v1/address/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res, next) => {
    const address = await Address.findById(req.params.id);

    if (!address) {
        return next(
            new ErrorResponse(`No address found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the address
    if (address.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(`This user cannot delete this address`, 401)
        );
    }

    await address.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

module.exports = {
    getUserAddress,
    getAllAddress,
    getAddress,
    addAddress,
    updateAddress,
    deleteAddress,
};
