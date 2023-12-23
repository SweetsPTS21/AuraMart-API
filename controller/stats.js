const Order = require("../models/Order");
const Product = require("../models/Product");
const Shop = require("../models/Shop");

const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const mongoose = require("mongoose");

// @desc    Get top sold product
// @route   GET /api/v1/stats
// @access  Private/Admin
const getTopSoldProduct = asyncHandler(async (req, res, next) => {
    const limit = parseInt(req.query.limit || 5);
    let result;

    if (req.query.sort === "order") {
        result = await Order.aggregate([
            { $sortByCount: "$product" },
            { $limit: limit },
        ]);
    } else {
        result = await Order.aggregate([
            {
                $group: {
                    _id: "$product",
                    soldQuantity: { $sum: "$quantity" },
                },
            },
            { $sort: { soldQuantity: -1 } },
            { $limit: limit },
        ]);
    }

    await Product.populate(result, {
        path: "_id",
        select: "name",
        populate: { path: "shop", model: "Shop", select: "name" },
    });

    result.forEach((item) => {
        if (item._id) {
            item.name = item._id._doc.name;
            item.shop = item._id._doc.shop.name;
            item._id = item._id._doc._id;
        }
    });

    res.status(200).json({
        success: true,
        total: result.length,
        data: result,
    });
});

// @desc    Get top sold product
// @route   GET /api/v1/stats
// @access  Private/Admin
const getTopSoldOfShop = asyncHandler(async (req, res, next) => {
    const shopId = req.params.shopId;
    const limit = parseInt(req.query.limit || 5);

    let result = await Order.aggregate([
        { $match: { shop: mongoose.Types.ObjectId(shopId) } },
        {
            $group: {
                _id: "$product",
                product: { $first: "$product" },
                soldQuantity: { $sum: "$quantity" },
            },
        },
        { $sort: { soldQuantity: -1 } },
        { $limit: limit },
    ]);

    await Product.populate(result, {
        path: "product",
        select: "name",
    });

    res.status(200).json({
        success: true,
        total: result.length,
        data: result,
    });
});

const getShopStatistic = asyncHandler(async (req, res, next) => {
    const shopId = req.params.shopId;
    const limit = parseInt(req.query.limit || 5);

    // statistic for shop with sold quantity, number of orders, number of products, number of reviews

    // number of shop orders
    const orders = await Shop.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(shopId) } },
        {
            $lookup: {
                from: "orders",
                localField: "_id",
                foreignField: "shop",
                as: "orders",
            },
        },
        { $project: { _id: 1, orders: { $size: "$orders" } } },
    ]);

    // number of shop products
    const products = await Shop.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(shopId) } },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "shop",
                as: "products",
            },
        },
        { $project: { _id: 1, products: { $size: "$products" } } },
    ]);

    // number of shop reviews get from shop's products
    const reviews = await Shop.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(shopId) } },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "shop",
                as: "products",
            },
        },
        {
            $lookup: {
                from: "reviews",
                localField: "products._id",
                foreignField: "product",
                as: "reviews",
            },
        },
        { $project: { _id: 1, reviews: { $size: "$reviews" } } },
    ]);

    // total revenue of shop base on orders total price
    // Order status = "Delivered" or status = "Received"
    const totalRevenue = await Order.aggregate([
        {
            $match: {
                shop: mongoose.Types.ObjectId(shopId),
                $or: [
                    { currentState: "Delivered" },
                    { currentState: "Received" },
                ],
            },
        },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
    ]);

    // number of followers of shop (random number 0-10000)
    const followers = await Shop.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(shopId) } },
        {
            $project: {
                _id: 1,
                followers: { $floor: { $multiply: [10000, Math.random()] } },
            },
        },
    ]);

    const result = {
        orders: orders[0] ? orders[0].orders : 0,
        products: products[0] ? products[0].products : 0,
        reviews: reviews[0] ? reviews[0].reviews : 0,
        revenue: totalRevenue[0] ? totalRevenue[0].totalRevenue : 0,
        followers: followers[0] ? followers[0].followers : 0,
    };

    res.status(200).json({
        success: true,
        total: result.length,
        data: result,
    });
});

module.exports = { getTopSoldProduct, getTopSoldOfShop, getShopStatistic };
