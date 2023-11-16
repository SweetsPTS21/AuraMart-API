const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc    Get all vnpay payment
// @route   GET /api/v1/vnpay
// @access  Public
const getVnpayPayment = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
});