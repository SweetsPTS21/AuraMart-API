const mongoose = require("mongoose");
const slugify = require("slugify");

// SCHEMA SETUP
const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, "Plase add a product name"],
        },
        slug: String,
        category: {
            type: [String],
            required: [true, "Please choose a category"],
            enum: [
                "phone-tablet",
                "electronics",
                "accessories",
                "cameras-lens",
                "tools-crafts",
                "toys-baby",
                "beauty",
                "sports",
                "vehicles",
                "international-goods",
                "books-gifts",
                "voucher",
            ],
        },
        price: {
            type: Number,
            required: [true, "Please add a price"],
            min: [0, "Price cannot be lower than 0"],
        },
        description: {
            type: String,
            required: [true, "Please add a description"],
        },
        dimensions: String,
        weight: String,
        specs: {
            type: String,
            required: [true, "Please add a specs information"],
        },
        branch: {
            type: String,
            required: [true, "Please add a branch"],
        },
        origin: {
            type: String,
            required: [true, "Please add a origin (country)"],
        },
        discount: {
            type: Number,
            max: [100, "Discount cannot be higher than 100%"],
            min: [0, "Discount cannot be lower than 0%"],
        },
        colors: {
            type: [String],
        },
        photo: {
            type: String,
            default: "no-photo.jpg",
        },
        averageRating: {
            type: Number,
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot be higher than 5"],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        quantity: {
            type: Number,
            min: [0, "Quantity cannot be lower than 0"],
        },
        soldQuantity: {
            type: Number,
            default: 0,
            min: [0, "Quantity cannot be lower than 0"],
        },
        shop: {
            type: mongoose.Schema.ObjectId,
            ref: "Shop",
            required: true,
        },
        sale: {
            type: Boolean,
            default: false,
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

// Create product slug from the name before save
ProductSchema.pre("save", function (next) {
    this.slug = slugify(this.name, {
        lower: true,
        remove: /[*+~.,/|()'"!:@]/g,
    });
    next();
});

// Create product slug from the name each update by id
ProductSchema.pre("findByIdAndUpdate", function (next) {
    this.slug = slugify(this.name, {
        lower: true,
        remove: /[*+~.,/|()'"!:@]/g,
    });
    next();
});

// Cascade delete reviews when a product is deleted
ProductSchema.pre("remove", async function (next) {
    console.log(`Reviews is being removed from product ${this._id}`);
    await this.model("Review").deleteMany({ product: this._id });
    next();
});

// Reverse populate with virtuals
ProductSchema.virtual("reviews", {
    ref: "Review",
    localField: "_id",
    foreignField: "product",
    justOne: false,
});

// Reverse populate with virtuals in order
ProductSchema.virtual("orders", {
    ref: "Order",
    localField: "_id",
    foreignField: "product",
    justOne: false,
});

module.exports = mongoose.model("Product", ProductSchema);
