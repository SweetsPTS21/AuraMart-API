const ShopConfig = require("../models/ShopConfig");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @dest    Get all configs
// @route   GET /api/v1/configs
// @access  Private
const getConfigs = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc    Get all shopConfigs
// @route   GET /api/v1/shops/:shopId/configs
// @access  Private
const getShopConfigs = asyncHandler(async (req, res, next) => {
    const shopConfigs = await ShopConfig.find({ shop: req.params.shopId });

    res.status(200).json({
        success: true,
        count: shopConfigs.length,
        data: shopConfigs,
    });
});

// @desc    Add new shopConfig
// @route   POST /api/v1/shops/:shopId/configs
// @access  Private
const addShopConfig = asyncHandler(async (req, res, next) => {
    req.body.shop = req.params.shopId;
    req.body.user = req.user.id;

    const role = req.user.role;

    // Make sure user is admin or seller
    if (role !== "admin" && role !== "seller") {
        return next(
            new ErrorResponse(`Not authorized to update shopConfig`),
            401
        );
    }
    //change all other shop's config using to false
    await ShopConfig.updateMany(
        { shop: req.params.shopId },
        { $set: { using: false } }
    );

    const shopConfig = await ShopConfig.create(req.body);

    res.status(201).json({
        success: true,
        data: shopConfig,
    });
});

// @desc    Update shopConfig
// @route   PUT /api/v1/shops/:shopId/configs/:id
// @access  Private
const updateShopConfig = asyncHandler(async (req, res, next) => {
    let shopConfig = await ShopConfig.findById(req.params.id);

    if (!shopConfig) {
        return next(
            new ErrorResponse(`No shopConfig with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is shopConfig owner
    if (
        shopConfig.user.toString() !== req.user.id && req.user.role !== "admin" 
    ) {
        return next(
            new ErrorResponse(`Not authorized to update shopConfig`),
            401
        );
    }
    //change all other shop's config using to false
    await ShopConfig.updateMany(
        { shop: req.params.shopId },
        { $set: { using: false } }
    );

    //update using config id
    shopConfig = await ShopConfig.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: shopConfig,
    });
});

// @desc    Delete shopConfig
// @route   DELETE /api/v1/shops/:shopId/configs/:id
// @access  Private
const deleteShopConfig = asyncHandler(async (req, res, next) => {
    const shopConfig = await ShopConfig.findById(req.params.id);

    if (!shopConfig) {
        return next(
            new ErrorResponse(`No shopConfig with the id of ${req.params.id}`),
            404
        );
    }

    // Make sure user is shopConfig owner
    if (
        shopConfig.user.toString() !== req.user.id &&
        req.user.role !== "admin"
    ) {
        return next(
            new ErrorResponse(`Not authorized to delete shopConfig`),
            401
        );
    }

    await shopConfig.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

module.exports = {
    getConfigs,
    getShopConfigs,
    addShopConfig,
    updateShopConfig,
    deleteShopConfig,
};
