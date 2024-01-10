const axios = require("axios");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const redis = require("redis");
const url = require("url");
const Product = require("../models/Product");
const fs = require("fs");

const recommend_api =
    process.env.FLASK_RECOMMEND_HOST ||
    "https://doan2023-recommender-cdd931f00885.herokuapp.com";

const redis_client = redis.createClient({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});

// @desc      Send build recommendation to heroku server
// @route     POST /api/v1/recommend/build
// @access    Private (admin only)
const sendBuildRecommendation = asyncHandler(async (req, res, next) => {
    await axios
        .get(`${recommend_api}/build`)
        .then((response) => {
            console.log(Date.now() + ": Build recommendation success");
            res.data = response.data;
        })
        .catch((error) => {
            console.error("Error:", error.message);
        });

    if (!res.data) {
        return next(
            new ErrorResponse(`No data. Consider check flask api`, 404)
        );
    }

    writeLogs();

    res.status(200).json({
        success: true,
        message: "Build recommendation success",
    });
});

// @desc      Get recommendation for a user
// @route     GET /api/v1/recommend/:userId
// @access    Public
const getRecommendation = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    await axios
        .get(`${recommend_api}/recommend/${userId}`)
        .then((response) => {
            console.log(response.data);
            res.data = response.data;
        })
        .catch((error) => {
            console.error("Error:", error.message);
        });

    // if no recommendation for user with id userId
    // return random 30 products with quantity > soldProduct
    if (res.data.error) {
        const totalProducts = await Product.countDocuments();

        // Generate 30 random indices
        const randomIndices = Array.from({ length: 30 }, () =>
            Math.floor(Math.random() * totalProducts)
        );

        // Retrieve products using the random indices
        const randomProducts = await Product.find()
            .skip(randomIndices[0])
            .limit(30);

        // cache the response in Redis for 1 hour
        redis_client.setex(
            `recommend_user:${userId}`,
            process.env.CACHE_EXPIRE || 3600,
            JSON.stringify(randomProducts)
        );

        return res.status(200).json({
            success: true,
            message: "Use random products for this user",
            data: randomProducts,
            length: randomProducts.length,
        });
    }

    writeLogs(userId);

    // get product list from database with list of product id
    const productListId = res.data.recommend_items;
    const productList = await Product.find({ _id: { $in: productListId } });

    // cache the response in Redis for 1 hour
    redis_client.setex(
        `recommend_user:${userId}`,
        process.env.CACHE_EXPIRE || 3600,
        JSON.stringify(productList)
    );

    res.status(200).json({
        success: true,
        data: productList,
    });
});

// @desc      Get common recommendation
// @route     GET /api/v1/recommend/common
// @access    Public
const getCommonRecommendation = asyncHandler(async (req, res, next) => {
    const getUrl = url.parse(req.url, true).href;

    const totalProducts = await Product.countDocuments();

    // Generate 30 random indices
    const randomIndices = Array.from({ length: 30 }, () =>
        Math.floor(Math.random() * totalProducts)
    );

    // Retrieve products using the random indices
    const randomProducts = await Product.find()
        .skip(randomIndices[0])
        .limit(30);

    // cache the response in Redis for 1 hour
    redis_client.setex(
        `recommend_common:${getUrl}`,
        process.env.CACHE_EXPIRE || 3600,
        JSON.stringify(randomProducts)
    );

    return res.status(200).json({
        success: true,
        message: "Use random recommend products",
        data: randomProducts,
        length: randomProducts.length,
    });
});

const checkCachedRecommend = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;

    redis_client.get(`recommend_user:${userId}`, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }
        if (data != null) {
            data = JSON.parse(data);
            res.status(200).json({
                success: true,
                source: "Redis. Is this faster???",
                total: data.length,
                data,
            });
        } else {
            next();
        }
    });
});

const checkCachedCommonRecommend = asyncHandler(async (req, res, next) => {
    const getUrl = url.parse(req.url, true).href;
    redis_client.get(`recommend_common:${getUrl}`, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }
        if (data != null) {
            data = JSON.parse(data);
            res.status(200).json({
                success: true,
                source: "Redis. Is this faster???",
                total: data.length,
                data,
            });
        } else {
            next();
        }
    });
});

const writeLogs = async (userId) => {
    const currentDate = Date.now();
    const logFilePath = "logs.txt";

    const ip = "192.168.0.12";
    const method = userId ? "GET" : "POST";
    const path = userId ? "/recommend/" + userId : "/recommend/build";
    const connectTime = Math.floor(Math.random() * 100); // Example connect time in milliseconds
    const serviceTime = Math.floor(Math.random() * 100); // Example service time in milliseconds
    const status = 200;
    const bytes = 655;
    const protocol = "https";

    const logEntry = `[${currentDate}]   from=${ip} method=${method} path="${path}" connect=${connectTime}ms service=${serviceTime}ms status=${status} bytes=${bytes} protocol=${protocol}`;

    await fs.appendFile(logFilePath, logEntry + "\n", (err) => {
        if (err) {
            console.log("Error writing to log file:", err);
        }
    });

    return logEntry;
};

module.exports = {
    sendBuildRecommendation,
    getRecommendation,
    checkCachedRecommend,
    getCommonRecommendation,
    checkCachedCommonRecommend,
};
