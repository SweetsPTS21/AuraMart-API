const Shop = require("../models/Shop");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const axios = require("axios");
const ghnToken = process.env.GHN_TOKEN;
const ghnUrl = process.env.GHN_URL;

// @desc    Get all shops
// @route   GET /api/v1/shops
// @access  Public
const getShops = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc    Get single shop
// @route   GET /api/v1/shops/:id
// @access  Public
const getShop = asyncHandler(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
        return next(
            new ErrorResponse(`Shop not found with id ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: shop,
    });
});

// @desc    Get single shop by user id
// @route   GET /api/v1/user/:userId/shop
// @access  Public
const getUserShop = asyncHandler(async (req, res, next) => {
    const shop = await Shop.findOne({ user: req.params.userId });
    if (!shop) {
        return next(
            new ErrorResponse(
                `Shop not found with user id ${req.params.userId}`,
                404
            )
        );
    }

    res.status(200).json({
        success: true,
        data: shop,
    });
});

// @desc    Create new shop
// @route   POST /api/v1/shops
// @access  Private
const createShop = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.user = req.user.id;

    // Check for existedShop
    const existedShop = await Shop.findOne({ user: req.user.id });

    // If the user is not an admin, they can create only 1 shop
    if (existedShop && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `The seller with id ${req.user.id} has already created a shop`,
                400
            )
        );
    }

    const shop = await Shop.create(req.body);

    res.status(201).json({
        success: true,
        data: shop,
    });
});

// @dest Register shop for user
// @route POST /api/v1/shops/register
// @access Private (admin, user)
const registerShop = asyncHandler(async (req, res, next) => {
    // Add user to req.body
    req.body.user = req.user.id;

    // Check for existedShop
    const existedShop = await Shop.findOne({ user: req.user.id });

    // If the user is not an admin, they can create only 1 shop
    if (existedShop && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `The seller with id ${req.user.id} has already created a shop`,
                400
            )
        );
    }

    // Change user role to seller
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { role: "seller" },
        {
            new: true,
            runValidators: true,
        }
    );

    const shop = await Shop.create(req.body);

    // Create ghn shop
    const ghnshop = await axios
        .post(
            ghnUrl + "/shop/register",
            {
                district_id: 1550,
                ward_code: "420112",
                name: shop.name,
                phone: shop.phone,
                address: "35 dd p12 qtb",
            },
            {
                headers: {
                    Token: ghnToken,
                },
            }
        )
        .catch((err) => {
            console.log(err);
        });

    // Update ghn shop id

    if (!ghnshop || ghnshop.data.code !== 200) {
        return next(new ErrorResponse(`Error when create GHN shop`, 400));
    }

    shop.ghnShopId = ghnshop.data.data.shop_id;
    await shop.save();

    res.status(201).json({
        success: true,
        data: shop,
    });
});

// @desc    Approve shop
// @route   PUT /api/v1/shops/:shopId/approve
// @access  Private
const approveShop = asyncHandler(async (req, res, next) => {
    const shopId = req.params.shopId;
    const shop = await Shop.findById(shopId);

    if (!shop) {
        return next(new ErrorResponse(`Shop not found with id ${shopId}`, 404));
    }

    // Make sure the user is shop owner
    if (shop.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `User ${req.user.id} cannot update this shop`,
                401
            )
        );
    }

    // check if shop is already approved
    if (shop.status === "active") {
        return next(
            new ErrorResponse(`Shop ${shopId} is already approved`, 400)
        );
    }

    await Shop.findByIdAndUpdate(
        shopId,
        { status: "active" },
        {
            new: true,
            runValidators: true,
        }
    );

    res.status(200).json({
        success: true,
        shopStatus: "active",
    });
});

// @desc    Update shop
// @route   PUT /api/v1/shops/:id
// @access  Private
const updateShop = asyncHandler(async (req, res, next) => {
    let shop = await Shop.findById(req.params.id);

    if (!shop) {
        return next(
            new ErrorResponse(`Shop not found with id ${req.params.id}`, 404)
        );
    }

    // Make sure the user is shop owner
    if (shop.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `User ${req.params.id} cannot update this shop`,
                401
            )
        );
    }

    shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: shop,
    });
});

// @desc    Delete shop
// @route   DELETE /api/v1/shops/:id
// @access  Private
const deleteShop = asyncHandler(async (req, res, next) => {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
        next(new ErrorResponse(`Shop not found with id ${req.params.id}`, 404));
    }

    // Make sure the user is shop owner
    if (shop.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `User ${req.params.id} cannot update this shop`,
                401
            )
        );
    }

    await shop.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

module.exports = {
    getShops,
    getShop,
    getUserShop,
    createShop,
    registerShop,
    approveShop,
    updateShop,
    deleteShop,
};
