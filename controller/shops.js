const Shop = require('../models/Shop');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

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
    data: shop
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
  if (existedShop && req.user.role !== 'admin') {
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
    data: shop
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
  if (shop.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.params.id} cannot update this shop`, 401)
    );
  }

  shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: shop
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
  if (shop.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.params.id} cannot update this shop`, 401)
    );
  }

  await shop.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = { getShops, getShop, createShop, updateShop, deleteShop };
