const mongoose = require("mongoose");

const MomoSchema = new mongoose.Schema(
    {
        partnerCode: {
            type: String,
            required: [true, "Please add a partnerCode"],
            trim: true,
        },
        partnerName: {
            type: String,
        },
        storeId: {
            type: String,
        },
        requestId: {
            type: String,
            required: [true, "Please add a requestId"],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, "Please add a amount"],
        },
        orderId: {
            type: String,
            required: [true, "Please add a orderId"],
            trim: true,
        },
        orderInfo: {
            type: String,
        },
        resultCode: {
            type: String,
        },
        responseTime: {
            type: String,
        },
        order: {
            type: String,
        },
    },
    {
        toString: { virtuals: true },
        toJSON: { virtuals: true },
    }
);

module.exports = mongoose.model("Momo", MomoSchema);
