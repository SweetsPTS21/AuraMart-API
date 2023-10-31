const mongoose = require("mongoose");
const slugify = require("slugify");

// SCHEMA SETUP
const UserVoucherSchema = new mongoose.Schema(
    {
        voucher: {
            type: mongoose.Schema.ObjectId,
            ref: "Voucher",
            required: true,
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Populate user and voucher
UserVoucherSchema.virtual("vouchers", {
    ref: "Voucher",
    localField: "voucher",
    foreignField: "_id",
    justOne: false,
});

module.exports = mongoose.model("UserVoucher", UserVoucherSchema);
