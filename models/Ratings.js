const mongoose = require("mongoose");

const RatingsSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, "Please add a rating between 1 and 5"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
});

// Prevent user from submitting more than one rating per product
RatingsSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
RatingsSchema.statics.getAverageRating = async function (productId) {
    const obj = await this.aggregate([
        {
            $match: { product: productId },
        },
        {
            $group: {
                _id: "$product",
                averageRating: { $avg: "$rating" },
            },
        },
    ]);

    try {
        await this.model("Product").findByIdAndUpdate(productId, {
            averageRating: obj[0].averageRating,
        });
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
RatingsSchema.post("save", function () {
    this.constructor.getAverageRating(this.product);
});

// Call getAverageRating before remove
RatingsSchema.pre("remove", function () {
    this.constructor.getAverageRating(this.product);
});

module.exports = mongoose.model("Ratings", RatingsSchema);
