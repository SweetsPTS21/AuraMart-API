const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const redis = require("redis");
const Stock = require("../models/Stock");
const StockProduct = require("../models/StockProduct");

const redis_client = redis.createClient({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});

// @desc  Get all stocks
// @route GET /api/v1/stocks
// @access Private
const getAllStocks = asyncHandler(async (req, res, next) => {
    return res.status(200).json(res.advancedResults);
});

// @desc  Get single stock of a shop
// @route GET /api/v1/shops/:shopId/stocks/:id
// @access Private
const getStock = asyncHandler(async (req, res, next) => {
    req.body.shop = req.params.shopId;
    const stock = await Stock.findById(req.params.id).populate({
        path: "products",
        select: "name price",
    });

    if (!stock) {
        return next(
            new ErrorResponse(`No stock found with id ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: stock,
    });
});

// @desc  Get all stocks of a shop
// @route GET /api/v1/shops/:shopId/stocks
// @access Private
const getShopStocks = asyncHandler(async (req, res, next) => {
    const { shopId } = req.params;

    const stocks = await Stock.find({ shop: shopId }).populate({
        path: "products",
        select: "name price",
    });

    if (!stocks) {
        return next(
            new ErrorResponse(`No stock found with shop id ${shopId}`, 404)
        );
    }

    // Cache the result in Redis for 1 hour to improve performance
    redis_client.setex(
        `stocks_shop:${shopId}`,
        process.env.CACHE_EXPIRE || 3600,
        JSON.stringify(stocks)
    );

    res.status(200).json({
        success: true,
        total: stocks.length,
        data: stocks,
    });
});

// @desc  Create new stock of a shop
// @route POST /api/v1/shops/:shopId/stocks
// @access Private
const createStock = asyncHandler(async (req, res, next) => {
    req.body.shop = req.params.shopId;
    const stock = await Stock.create(req.body);

    if (!stock) {
        return next(
            new ErrorResponse(`No stock found with shop id ${shopId}`, 404)
        );
    }

    res.status(201).json({
        success: true,
        data: stock,
    });
});

// @desc  Update stock of a shop
// @route PUT /api/v1/shops/:shopId/stocks/:id
// @access Private
const updateStock = asyncHandler(async (req, res, next) => {
    req.body.shop = req.params.shopId;
    let stock = await Stock.findById(req.params.id);

    if (!stock) {
        return next(
            new ErrorResponse(`No stock found with id ${req.params.id}`, 404)
        );
    }

    // Check if user is the owner of the stock
    if (stock.shop.toString() !== req.user.shop.toString()) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to update stock ${stock._id}`,
                401
            )
        );
    }

    stock = await Stock.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: stock,
    });
});

// @desc  Update product of a stock
// @route PUT /api/v1/shops/:shopId/stocks/:id/products/:productId
// @access Private
const updateProductOfStock = asyncHandler(async (req, res, next) => {
    req.body.shop = req.params.shopId;
    let stock = await Stock.findById(req.params.id);

    if (!stock) {
        return next(
            new ErrorResponse(`No stock found with id ${req.params.id}`, 404)
        );
    }

    // Check if user is the owner of the stock
    if (stock.shop.toString() !== req.user.shop.toString()) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to update stock ${stock._id}`,
                401
            )
        );
    }

    stock = await Stock.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: stock,
    });
});

// @desc  Delete stock of a shop
// @route DELETE /api/v1/shops/:shopId/stocks/:id
// @access Private
const deleteStock = asyncHandler(async (req, res, next) => {
    req.body.shop = req.params.shopId;
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
        return next(
            new ErrorResponse(`No stock found with id ${req.params.id}`, 404)
        );
    }

    // Check if user is the owner of the stock
    if (stock.shop.toString() !== req.user.shop.toString()) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not authorized to delete stock ${stock._id}`,
                401
            )
        );
    }

    stock.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

module.exports = {
    getAllStocks,
    getStock,
    getShopStocks,
    createStock,
    updateStock,
    deleteStock,
};
