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
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

module.exports = mongoose.model("Voucher", VoucherSchema);
