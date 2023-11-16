const mongoose = require("mongoose");

const vnpaySchema = new mongoose.Schema(
    {
        vnp_Amount: {
            type: Number,
            required: [true, "Please add an amount"],
        },
        vnp_BankCode: {
            type: String,
        },
        vnp_BankTranNo: {
            type: String,
        },
        vnp_CardType: {
            type: String,
        },
        vnp_OrderInfo: {
            type: String,
            required: [true, "Please add an order info"],
        },
        vnp_OrderType: {
            type: String,
        },
        vnp_CreateDate: {
            type: String,
        },
        vnp_PayDate: {
            type: String,
        },
        vnp_ResponseCode: {
            type: String,
        },
        vnp_TmnCode: {
            type: String,
        },
        vnp_TransactionNo: {
            type: String,
        },
        vnp_TxnRef: {
            type: String,
        },
        vnp_SecureHash: {
            type: String,
        },
        orderId: {
            type: String,
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

module.exports = mongoose.model("Vnpay", vnpaySchema);