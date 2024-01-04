const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema(
    {
        home1: {
            type: [String],
        },
        home2: {
            type: [String],
        },
        search: {
            type: [String],
        },
        other: {
            type: [String],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

module.exports = mongoose.model("Banner", BannerSchema);
