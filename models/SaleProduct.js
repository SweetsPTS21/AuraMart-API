const mongoose = require("mongoose");

const SaleProductSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
            required: true,
        },
        sale: {
            type: Boolean,
            default: false,
        },
        discount: {
            type: Number,
            max: [100, "Discount cannot be higher than 100%"],
            min: [0, "Discount cannot be lower than 0%"],
        },
        quantity: {
            type: Number,
            min: [0, "Quantity cannot be lower than 0"],
        },
        soldQuantity: {
            type: Number,
            min: [0, "Quantity cannot be lower than 0"],
        },
        beginAt: {
            type: Date,
        },
        endIn: {
            type: String,
            enum: ["30", "60", "90", "120"],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        shop: {
            type: mongoose.Schema.ObjectId,
            ref: "Shop",
            required: true,
        },
        createAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

module.exports = mongoose.model("SaleProduct", SaleProductSchema);
