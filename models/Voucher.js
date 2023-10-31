const mongoose = require("mongoose");
const slugify = require("slugify");

// SCHEMA SETUP

const VoucherSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
        },
        discount: {
            type: Number,
            required: true,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        minimumSpend: {
            type: Number,
            required: true,
        },
        maximumDiscount: {
            type: Number,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
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

// Populate user and voucher
VoucherSchema.virtual("uservouchers", {
    ref: "UserVoucher",
    localField: "_id",
    foreignField: "voucher",
    justOne: false,
});

module.exports = mongoose.model("Voucher", VoucherSchema);
