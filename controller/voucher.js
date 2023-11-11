const Voucher = require("../models/Voucher");
const UserVoucher = require("../models/UserVoucher");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @dest    Get all vouchers
// @route   GET /api/v1/vouchers
// @access  Private
const getVouchers = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc    Get all shopVoucher
// @route   GET /api/v1/shops/:shopId/vouchers
// @access  Private
const getShopVoucher = asyncHandler(async (req, res, next) => {
    const shopVoucher = await Voucher.find({ shop: req.params.shopId });

    res.status(200).json({
        success: true,
        count: shopVoucher.length,
        data: shopVoucher,
    });
});

// @desc   Get single voucher by code
// @route   GET /api/v1/vouchers/:code
// @access  Public
const getVoucherByCode = asyncHandler(async (req, res, next) => {
    const voucher = await Voucher.findOne({ code: req.query.code });

    if (!voucher) {
        return next(
            new ErrorResponse(`Voucher not found with code ${req.query.code}`),
            404
        );
    }

    res.status(200).json({
        success: true,
        data: voucher,
    });
});


// @desc    Get user voucher
// @route   GET /api/v1/users/:userId/vouchers
// @access  Private
const getUserVoucher = asyncHandler(async (req, res, next) => {
    const userVoucher = await UserVoucher.find({ user: req.params.userId }).populate({
        path: "vouchers",
        select: "code discount expiryDate minimumSpend maximumDiscount",
    });

    if (!userVoucher) {
        return next(
            new ErrorResponse(`No voucher found with user id ${req.params.userId}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        count: userVoucher.length,
        data: userVoucher,
    });
});

// @desc    Check owner of voucher
// @route   GET /api/v1/users/:userId/vouchers/:id
// @access  Private
const checkOwnerVoucher = asyncHandler(async (req, res, next) => {
    const userVoucher = await UserVoucher.find({
        user: req.params.userId,
        voucher: req.params.id,
    });

    res.status(200).json({
        success: true,
        count: userVoucher.length,
        data: userVoucher,
    });
});

// @desc    add user voucher
// @route   POST /api/v1/users/:userId/vouchers/:voucherId
// @access  Private
const addUserVoucher = asyncHandler(async (req, res, next) => {
    req.body.user = req.params.userId;
    req.body.voucher = req.params.id;

    const userVoucher = await UserVoucher.create(req.body);

    res.status(201).json({
        success: true,
        data: userVoucher,
    });
});

// @desc    Add new voucher
// @route   POST /api/v1/shops/:shopId/vouchers
// @access  Private
const addShopVoucher = asyncHandler(async (req, res, next) => {
    req.body.shop = req.params.shopId;
    req.body.user = req.user.id;

    const shopVoucher = await Voucher.create(req.body);

    res.status(201).json({
        success: true,
        data: shopVoucher,
    });
});

// @desc    Update shopVoucher
// @route   PUT /api/v1/shops/:shopId/vouchers/:id
// @access  Private
const updateShopVoucher = asyncHandler(async (req, res, next) => {
    let shopVoucher = await Voucher.findById(req.params.id);

    if (!shopVoucher) {
        return next(
            new ErrorResponse(`No voucher with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is shopVoucher owner
    if (
        shopVoucher.user.toString() !== req.user.id &&
        (req.user.role !== "admin" || req.user.role !== "seller")
    ) {
        return next(
            new ErrorResponse(`Not authorized to update shopVoucher`),
            401
        );
    }

    //update using Voucher id
    shopVoucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: shopVoucher,
    });
});

// @desc    Delete voucher
// @route   DELETE /api/v1/shops/:shopId/vouchers/:id
// @access  Private
const deleteShopVoucher = asyncHandler(async (req, res, next) => {
    const shopVoucher = await Voucher.findById(req.params.id);

    if (!shopVoucher) {
        return next(
            new ErrorResponse(`No voucher with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is shopVoucher owner
    if (
        shopVoucher.user.toString() !== req.user.id &&
        (req.user.role !== "admin" || req.user.role !== "seller")
    ) {
        return next(
            new ErrorResponse(`Not authorized to delete shopVoucher`),
            401
        );
    }

    await shopVoucher.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

module.exports = {
    getVouchers,
    getVoucherByCode,
    getShopVoucher,
    getUserVoucher,
    checkOwnerVoucher,
    addUserVoucher,
    addShopVoucher,
    updateShopVoucher,
    deleteShopVoucher,
};
