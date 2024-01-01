const mongoose = require("mongoose");

const DenunciationSchema = new mongoose.Schema(
    {
        reason: {
            type: String,
            required: [true, "Please add a reason"],
            trim: true,
            maxlength: [50, "Reason can not be more than 50 characters"],
        },
        description: {
            type: String,
            required: [true, "Please add a description"],
            maxlength: [500, "Description can not be more than 500 characters"],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        product: {
            type: mongoose.Schema.ObjectId,
            ref: "Product",
        },
        shop: {
            type: mongoose.Schema.ObjectId,
            ref: "Shop",
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

module.exports = mongoose.model("Denunciation", DenunciationSchema);
