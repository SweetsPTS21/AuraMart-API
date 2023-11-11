const mongoose = require("mongoose");
const slugify = require("slugify");

const StockProductSchema = new mongoose.Schema(
    {
        quantity: {
            type: Number,
            required: [true, "Please add a quantity"],
        },
        product: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
        },
        stock: {
            type: mongoose.Schema.ObjectId,
            ref: "Stock",
            required: true,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// reverse populate with virtuals
StockProductSchema.virtual("products", {
    ref: "Product",
    localField: "product",
    foreignField: "_id",
    justOne: false,
});

module.exports = mongoose.model("StockProduct", StockProductSchema);
