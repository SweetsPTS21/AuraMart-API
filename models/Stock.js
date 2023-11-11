const mongoose = require("mongoose");
const slugify = require("slugify");

const StockSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, "Plase add a stock name"],
        },
        address: {
            type: String,
            required: [true, "Please add a address"],
        },
        phone: {
            type: String,
            required: [true, "Please add a phone"],
        },
        capacity: {
            type: Number,
            required: [true, "Please add a capacity"],
        },
        description: {
            type: String,
            required: [true, "Please add a description"],
        },
        shop: {
            type: mongoose.Schema.ObjectId,
            ref: "Shop",
            required: true,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// reverse populate with virtuals
StockSchema.virtual("products", {
    ref: "Product",
    localField: "_id",
    foreignField: "stock",
    justOne: false,
});

module.exports = mongoose.model("Stock", StockSchema);
