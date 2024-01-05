const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const fs = require("fs");
const Banner = require("../models/Banner");

// @desc   Get recommended logs
// @route  GET /api/v1/systems/logs
// @access Private/Admin
const getRecommendedLogs = asyncHandler(async (req, res, next) => {
    // Read logs from file
    const logs = fs.readFileSync("logs.txt", "utf8");

    // Split logs into array
    const logsArray = logs.split("\n");

    return res.status(200).json({
        success: true,
        data: logsArray,
        total: logsArray.length,
    });
});

// @desc     Clear logs
// @route    DELETE /api/v1/systems/logs
// @access   Private/Admin
const clearLogs = asyncHandler(async (req, res, next) => {
    fs.writeFileSync("logs.txt", "", "utf8");

    return res.status(200).json({
        success: true,
        message: "Logs cleared",
    });
});

// @dest    Set system banners
// @route   POST /api/v1/systems/banners
// @access  Private/Admin
const setBanners = asyncHandler(async (req, res, next) => {
    const banners = req.body;

    if (!banners) {
        return next(new ErrorResponse("Please provide banners", 400));
    }

    // set current using to true
    banners.using = true;

    const banners_ = await Banner.create(req.body);

    // set all other banners to false
    await Banner.updateMany(
        { _id: { $ne: banners_._id } },
        { $set: { using: false } }
    );

    return res.status(200).json({
        success: true,
        data: banners_,
    });
});

// @dest    Get all system banners
// @route   GET /api/v1/systems/banners
// @access  Private/Admin
const getBanners = asyncHandler(async (req, res, next) => {
    // Get banner with using = true
    const banners = await Banner.find();

    return res.status(200).json({
        success: true,
        data: banners,
        length: banners.length,
    });
});

module.exports = {
    getRecommendedLogs,
    clearLogs,
    getBanners,
    setBanners,
};
