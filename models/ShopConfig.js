const mongoose = require("mongoose");
const slugify = require("slugify");
const Voucher = require("./Voucher");

// SCHEMA SETUP
const ShopConfigSchema = new mongoose.Schema(
    {
        decoration: {
            type: [String],
            required: [true, "Please add a decoration"],
        },
        banner: {
            type: [String],
            required: [true, "Please add a banner"],
        },
        vouchers: {
            type: [String],
        },
        shop: {
            type: mongoose.Schema.ObjectId,
            ref: "Shop",
            required: true,
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

module.exports = mongoose.model("ShopConfig", ShopConfigSchema);
