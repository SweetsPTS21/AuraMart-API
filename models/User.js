const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a name"],
    },
    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        match: [
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please add a valid email",
        ],
    },
    password: {
        type: String,
        required: [true, "Please add a password"],
        minlength: [6, "Password must be longer than 6 characters"],
        select: false,
    },
    role: {
        type: String,
        enum: ["user", "seller", "admin"],
        default: "user",
    },
    address: String,
    phone: {
        type: String,
        maxlength: [15, "Phone number cannot be longer than 15 characters"],
    },
    gender: {
        type: String,
        enum: ["male", "female", "other", "Male", "Female", "Other"],
    },
    dob: {
        type: Date,
    },
    avatar: {
        type: String,
        default: "no-photo.jpg",
    },
    age: Number,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Calculate age
UserSchema.pre("save", async function (next) {
    const years = parseInt(
        (Date.now() - this.dob) / (1000 * 3600 * 24 * 365.25)
    );
    this.age = years;
});

// Sign JWT token and return the token
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// Match user entered password to hashed password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // Set expire time
    this.resetPasswordExpire = Date.now() + 10 * 16 * 1000;

    return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
