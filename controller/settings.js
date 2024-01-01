const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const fs = require("fs");

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

module.exports = {
    getRecommendedLogs,
    clearLogs,
};
