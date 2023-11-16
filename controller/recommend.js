const axios = require("axios");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const redis = require("redis");
const Product = require("../models/Product");

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
            console.log(response.data);
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

    redis_client.setex("recommend_data", 3600, JSON.stringify(res.data));

    res.status(200).json({
        success: true,
        data: res.data,
    });
});

// @desc      Get recommendation for a user
// @route     GET /api/v1/recommend/:userId
// @access    Private (admin only)
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

    if (!res.data) {
        return next(
            new ErrorResponse(
                `No recommendation for user with id ${userId}`,
                404
            )
        );
    }

    // get product list from database with list of product id
    const productListId = res.data.recommend_items;
    const productList = await Product.find({ _id: { $in: productListId } });

    // cache the response in Redis for 1 hour
    redis_client.setex(
        `recommend_user:${userId}`,
        3600,
        JSON.stringify(productList)
    );

    res.status(200).json({
        success: true,
        data: productList,
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

const checkCacheData = asyncHandler(async (req, res, next) => {
    redis_client.get("recommend_data", (err, data) => {
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

module.exports = {
    sendBuildRecommendation,
    getRecommendation,
    checkCachedRecommend,
    checkCacheData,
};