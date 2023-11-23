const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
        },
        shop: {
            type: mongoose.Schema.ObjectId,
            ref: "Shop",
            required: true,
        },
        quantity: Number,
        address: {
            type: String,
            required: [true, "Please add an address"],
        },
        phone: {
            type: String,
            required: [true, "Please add a phone number"],
        },
        receiver: {
            type: String,
        },
        total: {
            type: Number,
            required: [true, "Please add total price"],
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["COD", "VNPAY", "MOMO"],
            default: "COD",
        },
        paymentState: {
            type: String,
            required: true,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        currentState: {
            type: String,
            required: true,
            enum: [
                "Ordered Successfully",
                "Tiki Received",
                "Getting Product",
                "Packing",
                "Shipping",
                "Delivered",
                "Cancelled",
            ],
            default: "Ordered Successfully",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

module.exports = mongoose.model("Order", OrderSchema);
