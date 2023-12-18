const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const StockProduct = require("../models/StockProduct");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const axios = require("axios");
const ghnToken = process.env.GHN_TOKEN;
const ghnUrl = process.env.GHN_URL;

// @desc    Get all orders
// @route   GET /api/v1/orders
// @route   GET /api/v1/shops/:shopId/orders
// @access  Public
const getOrders = asyncHandler(async (req, res, next) => {
    if (req.params.shopId) {
        let orders = await Order.find({ shop: req.params.shopId });

        // get all order details by shop id
        let orderDetails = await OrderDetail.find({ shop: req.params.shopId })
            .populate({
                path: "product shop",
                select: "name slug photo price discount",
            })
            .sort("-createdAt");
        // get all orders by shop id
        let shopOrders = [];
        orders.forEach((order) => {
            let orderDetail = orderDetails.filter(
                (orderDetail) =>
                    orderDetail.order.toString() === order._id.toString()
            );
            shopOrders.push({
                ...order._doc,
                orderDetails: orderDetail,
            });
        });

        return res.status(200).json({
            success: true,
            total: shopOrders.length,
            data: shopOrders,
        });
    } else {
        res.status(200).json(res.advancedResults);
    }
});

// @desc    Get all orders of an user
// @route   GET /api/v1/auth/:userId/orders
// @access  Private: User-Admin
const getUserOrders = asyncHandler(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 5;
    const sortBy = req.query.sort || "createdAt";

    let orders = await Order.find({ user: req.params.userId })
        .populate({
            path: "product shop",
            select: "name slug photo price discount",
        })
        .sort("-" + sortBy)
        .limit(limit);

    req.body.user = req.user.id;

    // Allow user to get his/her history only
    if (req.params.userId !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(`Not allow to get history of other user`, 401)
        );
    }

    return res.status(200).json({
        success: true,
        total: orders.length,
        data: orders,
    });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Public
const getOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate({
        path: "product shop",
        select: "name",
    });

    if (!order) {
        return next(
            new ErrorResponse(`No order found with id ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        data: order,
    });
});

// @desc    Add order
// @route   POST /api/v1/checkout
// @access  Private
const addOrder = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    const orders = req.body

    // orders.forEach(async (order) => {
    //     const order_ = await Order.create(order);

    //     // Create order detail
    //     order.products.forEach(async (product) => {
    //         const orderDetail = {
    //             order: order_._id,
    //             ...product,
    //         };

    //         await OrderDetail.create(orderDetail);

    //         // Update product sold quantity
    //         const product_ = await Product.findById(product.product);
    //         product_.soldQuantity += product.quantity;
    //         await product_.save();

    //         // Update stock product quantity
    //         const stockProduct = await StockProduct.findOne({
    //             product: product.product,
    //             shop: product.shop,
    //         });

    //         if (stockProduct) {
    //             stockProduct.quantity -= product.quantity;
    //             await stockProduct.save();
    //         }
    //     });
    // })

    // // const ghnData = {
    // //     payment_type_id: 2,
    // //     note: "This is note",
    // //     required_note: "KHONGCHOXEMHANG",
    // //     from_name: shop.name,
    // //     from_phone: shop.phone,
    // //     from_address: shop.address,
    // //     from_ward_name: "Phường 14",
    // //     from_district_name: "Quận 10",
    // //     from_province_name: "HCM",
    // //     return_phone: "0332190444",
    // //     return_address: "39 NTT",
    // //     return_district_id: null,
    // //     return_ward_code: "",
    // //     client_order_code: "",
    // //     to_name: order.receiver,
    // //     to_phone: order.phone,
    // //     to_address: order.address,
    // //     to_ward_code: "20308",
    // //     to_district_id: 1444,
    // //     cod_amount: order.total,
    // //     content: "This is content",
    // //     weight: 200,
    // //     length: 1,
    // //     width: 19,
    // //     height: 10,
    // //     pick_station_id: 1444,
    // //     deliver_station_id: null,
    // //     insurance_value: 4000000,
    // //     service_id: 0,
    // //     service_type_id: 2,
    // //     coupon: null,
    // //     pick_shift: [2],
    // //     items: [
    // //         {
    // //             name: product.name,
    // //             code: "Polo123",
    // //             quantity: order.quantity,
    // //             price: product.price,
    // //             length: 12,
    // //             width: 12,
    // //             height: 12,
    // //             weight: 1200,
    // //             category: {
    // //                 level1: "Áo",
    // //             },
    // //         },
    // //     ],
    // // };

    // // if (order.shippingMethod === "GHN") {
    // //     const ghnResponse = await axios
    // //         .post(ghnUrl + "/shipping-order/create", ghnData, {
    // //             headers: {
    // //                 Token: ghnToken,
    // //                 ShopId: shop.ghnShopId,
    // //             },
    // //         })
    // //         .catch((err) => {
    // //             const error = err.response.data;
    // //             console.log({ code: error.code, message: error.message });
    // //             return next(
    // //                 new ErrorResponse(
    // //                     `Error when create GHN order: ${error.message}`,
    // //                     400
    // //                 )
    // //             );
    // //         });

    // //     if (!ghnResponse || ghnResponse.data.code !== 200) {
    // //         return next(new ErrorResponse(`Error when create GHN order`, 400));
    // //     }

    // //     order.ghnOrderCode = ghnResponse.data.data.order_code;
    // // }

    // // Create order
    // const order_ = await Order.create(order);

    // // Create order detail
    // products.forEach(async (product) => {
    //     const orderDetail = {
    //         order: order_._id,
    //         product: product.product,
    //         shop: product.shop,
    //         quantity: product.quantity,
    //         color: product.color,
    //         total: product.total,
    //         note: product.note,
    //     };

    //     await OrderDetail.create(orderDetail);

    //     // Update product sold quantity
    //     const product_ = await Product.findById(product.product);
    //     product_.soldQuantity += product.quantity;
    //     await product_.save();

    //     // Update stock product quantity
    //     const stockProduct = await StockProduct.findOne({
    //         product: product.product,
    //         shop: product.shop,
    //     });

    //     if (stockProduct) {
    //         stockProduct.quantity -= product.quantity;
    //         await stockProduct.save();
    //     }
    // });

    res.status(201).json({
        success: true,
        data: orders,
    });
});

// @desc    Update order
// @route   PUT /api/v1/orders/:id
// @access  Private/ User - Admin
const updateOrder = asyncHandler(async (req, res, next) => {
    let order = await Order.findById(req.params.id);
    req.body.user = req.user.id;

    if (!order) {
        return next(
            new ErrorResponse(`No review found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the order
    if (order.user.toString() !== req.user.id && req.user.role === "user") {
        return next(
            new ErrorResponse(`This user cannot update this order`, 401)
        );
    }
    order = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: order,
    });
});

// @desc    Delete order
// @route   DELETE /api/v1/orders/:id
// @access  Private
const deleteOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`No order found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the order
    if (order.user.toString() !== req.user.id && req.user.role === "user") {
        return next(
            new ErrorResponse(`This user cannot delete this order`, 401)
        );
    }

    await order.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

// @desc    Cancel order
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`No order found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the order
    if (order.user.toString() !== req.user.id) {
        return next(
            new ErrorResponse(`This user cannot cancel this order`, 401)
        );
    }

    // Check if order is in the right state
    if (order.currentState !== "Ordered Successfully") {
        return next(
            new ErrorResponse(
                `Cannot cancel order with current state ${order.currentState}`,
                401
            )
        );
    }

    order.currentState = "Cancelled";

    await order.save();

    res.status(200).json({
        success: true,
        data: order,
    });
});

// @desc    Confirm received order
// @route   PUT /api/v1/orders/:id/confirm
// @access  Private
const confirmReceivedOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(
            new ErrorResponse(`No order found with id ${req.params.id}`, 404)
        );
    }

    // Check ownership of the order
    if (order.user.toString() !== req.user.id) {
        return next(
            new ErrorResponse(`This user cannot confirm this order`, 401)
        );
    }

    // Check if order is in the right state
    if (order.currentState !== "Delivered") {
        return next(
            new ErrorResponse(
                `Cannot confirm order with current state ${order.currentState}`,
                401
            )
        );
    }

    // Update order state
    order.currentState = "Received";
    order.paymentState = "Paid";

    await order.save();

    res.status(200).json({
        success: true,
        data: order,
    });
});

module.exports = {
    getOrders,
    getUserOrders,
    getOrder,
    addOrder,
    updateOrder,
    deleteOrder,
    cancelOrder,
    confirmReceivedOrder,
};
