const mongoose = require("mongoose");

const OrderDetailSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.ObjectId,
            ref: "Order",
            required: true,
        },
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
        color: String,
        total: Number,
        note: String,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Populate product when finding order detail
OrderDetailSchema.pre(/^find/, function (next) {
    this.populate({
        path: "product",
        select: "name price photo",
    });
    next();
});

module.exports = mongoose.model("OrderDetail", OrderDetailSchema);
