const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Please add a full name"],
        },
        phone: {
            type: String,
            required: [true, "Please add a phone number"],
        },
        city: {
            type: String,
            required: [true, "Please add a city"],
        },
        district: {
            type: String,
            required: [true, "Please add a district"],
        },
        ward: {
            type: String,
            required: [true, "Please add a ward"],
        },
        address: {
            type: String,
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        default: {
            type: Boolean,
            default: false,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

//Remove all addresses of a user when the user is removed
addressSchema.pre("remove", async function (next) {
    console.log(`Address is being removed from user ${this._id}`);
    await this.model("User").deleteMany({ address: this._id });
    next();
});

module.exports = mongoose.model("Address", addressSchema);
