const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const config = require("config");
const request = require("request");
const moment = require("moment");
const Order = require("../models/Order");
const Vnpay = require("../models/Vnpay");

// @desc    Send request to vnpay
// @route   POST /api/v1/payment/vnpay/create
// @access  Public
const vnpayCreatePayment = asyncHandler(async (req, res, next) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";

    let date = new Date();
    let createDate = moment(date).format("YYYYMMDDHHmmss");

    let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let config = require("config");

    let tmnCode = config.get("vnp_TmnCode");
    let secretKey = config.get("vnp_HashSecret");
    let vnpUrl = config.get("vnp_Url");
    let returnUrl = config.get("vnp_ReturnUrl");
    let orderId = moment(date).format("DDHHmmss");
    let amount = req.body.amount;
    let bankCode = req.body.bankCode;
    let order = req.body.orderId;

    let locale = req.body.language;
    if (locale === null || locale === "") {
        locale = "vn";
    }
    let currCode = "VND";
    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = locale;
    vnp_Params["vnp_CurrCode"] = currCode;
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100;
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    if (bankCode !== null && bankCode !== "") {
        vnp_Params["vnp_BankCode"] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    // Them giao dich vnpay vao database
    const vnpay = await Vnpay.create({
        vnp_Amount: amount,
        vnp_OrderInfo: "Thanh toan cho ma GD:" + orderId,
        vnp_TxnRef: orderId,
        vnp_CreateDate: createDate,
        orderId: order,
    });

    res.status(200).json({
        code: "00",
        data: vnpUrl,
        create: vnpay,
    });
});

// @desc    Vnpay return
// @route   GET /api/v1/payment/vnpay/vnpay_return
// @access  Public
const vnpayReturn = asyncHandler(async (req, res, next) => {
    let vnp_Params = req.query;

    let secureHash = vnp_Params["vnp_SecureHash"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    let config = require("config");
    let secretKey = config.get("vnp_HashSecret");

    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
        //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
        const vnpay = await Vnpay.findOne({
            vnp_TxnRef: vnp_Params["vnp_TxnRef"],
        });

        if (vnpay === null) {
            res.status(200).json({
                success: false,
                code: "01",
                message: "Order not found with id " + vnp_Params["vnp_TxnRef"],
            });
        }
        res.status(200).json({
            success: true,
            code: vnp_Params["vnp_ResponseCode"],
        });
    } else {
        res.status(500).json({
            success: false,
            code: "97",
        });
    }
});

// @desc    Vnpay inp
// @route   GET /api/v1/payment/vnpay/vnpay_ipn
// @access  Public
const vnpayIpn = asyncHandler(async (req, res, next) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params["vnp_SecureHash"];

    let orderId = vnp_Params["vnp_TxnRef"];
    let rspCode = vnp_Params["vnp_ResponseCode"];

    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    let config = require("config");
    let secretKey = config.get("vnp_HashSecret");
    let querystring = require("qs");
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

    const vnpay = await Vnpay.findOne({ vnp_TxnRef: orderId });
    const orderData = await Order.findById(vnpay.orderId);

    let paymentStatus = orderData.paymentState; // Giả sử 'Pending' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
    //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
    //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

    let checkOrderId = !!vnpay.vnp_TxnRef; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
    let checkAmount = !!vnpay.vnp_Amount; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn

    if (secureHash === signed) {
        //kiểm tra checksum
        if (checkOrderId) {
            if (checkAmount) {
                if (paymentStatus === "Pending") {
                    //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán

                    if (rspCode === "00") {
                        //thanh cong
                        paymentStatus = "Paid";

                        // Cap nhat lai trang thai giao dich
                        vnpay.vnp_ResponseCode = rspCode;
                        vnpay.vnp_BankCode = vnp_Params["vnp_BankCode"];
                        vnpay.vnp_BankTranNo = vnp_Params["vnp_BankTranNo"];
                        vnpay.vnp_CardType = vnp_Params["vnp_CardType"];
                        vnpay.vnp_PayDate = vnp_Params["vnp_PayDate"];
                        vnpay.vnp_TransactionNo =
                            vnp_Params["vnp_TransactionNo"];
                        vnpay.vnp_TmnCode = vnp_Params["vnp_TmnCode"];
                        vnpay.save();

                        // Cap nhat trang thai don hang thanh cong
                        await Order.findByIdAndUpdate(vnpay.orderId, {
                            paymentState: paymentStatus,
                        });

                        // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
                        res.status(200).json({
                            rspcode: "00",
                            message: "Success",
                        });
                    } else {
                        //that bai
                        paymentStatus = "Pending";

                        // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
                        // Cap nhat trang thai don hang that bai
                        await Order.findByIdAndUpdate(vnpay.orderId, {
                            paymentState: paymentStatus,
                        });

                        res.status(200).json({
                            rspcode: "03",
                            message: "Fail to update order status",
                        });
                    }
                } else {
                    res.status(200).json({
                        rspcode: "02",
                        message:
                            "This order has been updated to the payment status",
                    });
                }
            } else {
                res.status(200).json({
                    rspcode: "04",
                    message: "Amount invalid",
                });
            }
        } else {
            res.status(200).json({ rspcode: "01", message: "Order not found" });
        }
    } else {
        res.status(200).json({ rspcode: "97", message: "Checksum failed" });
    }
});

// @desc    Vnpay query order
// @route   POST /api/v1/payment/vnpay/query
// @access  Public
const vnpayQueryOrder = asyncHandler(async (req, res, next) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    let date = new Date();

    let config = require("config");
    let crypto = require("crypto");

    let vnp_TmnCode = config.get("vnp_TmnCode");
    let secretKey = config.get("vnp_HashSecret");
    let vnp_Api = config.get("vnp_Api");

    let vnp_TxnRef = req.body.orderId;
    let vnp_TransactionDate = req.body.transDate;

    let vnp_RequestId = moment(date).format("HHmmss");
    let vnp_Version = "2.1.0";
    let vnp_Command = "querydr";
    let vnp_OrderInfo = "Truy van GD ma:" + vnp_TxnRef;

    let vnp_IpAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

    let data =
        vnp_RequestId +
        "|" +
        vnp_Version +
        "|" +
        vnp_Command +
        "|" +
        vnp_TmnCode +
        "|" +
        vnp_TxnRef +
        "|" +
        vnp_TransactionDate +
        "|" +
        vnp_CreateDate +
        "|" +
        vnp_IpAddr +
        "|" +
        vnp_OrderInfo;

    let hmac = crypto.createHmac("sha512", secretKey);
    let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

    let dataObj = {
        vnp_RequestId: vnp_RequestId,
        vnp_Version: vnp_Version,
        vnp_Command: vnp_Command,
        vnp_TmnCode: vnp_TmnCode,
        vnp_TxnRef: vnp_TxnRef,
        vnp_OrderInfo: vnp_OrderInfo,
        vnp_TransactionDate: vnp_TransactionDate,
        vnp_CreateDate: vnp_CreateDate,
        vnp_IpAddr: vnp_IpAddr,
        vnp_SecureHash: vnp_SecureHash,
    };
    // /merchant_webapi/api/transaction
    request(
        {
            url: vnp_Api,
            method: "POST",
            json: true,
            body: dataObj,
        },
        function (error, response, body) {
            console.log(response);
        }
    );
});

// @desc    Vnpay refund
// @route   POST /api/v1/payment/vnpay/refund
// @access  Public
const vnpayRefund = asyncHandler(async (req, res, next) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    let date = new Date();

    let config = require("config");
    let crypto = require("crypto");

    let vnp_TmnCode = config.get("vnp_TmnCode");
    let secretKey = config.get("vnp_HashSecret");
    let vnp_Api = config.get("vnp_Api");

    let vnp_TxnRef = req.body.orderId;
    let vnp_TransactionDate = req.body.transDate;
    let vnp_Amount = req.body.amount * 100;
    let vnp_TransactionType = req.body.transType;
    let vnp_CreateBy = req.body.user;

    let vnp_RequestId = moment(date).format("HHmmss");
    let vnp_Version = "2.1.0";
    let vnp_Command = "refund";
    let vnp_OrderInfo = "Hoan tien GD ma:" + vnp_TxnRef;

    let vnp_IpAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

    let vnp_TransactionNo = "0";

    let data =
        vnp_RequestId +
        "|" +
        vnp_Version +
        "|" +
        vnp_Command +
        "|" +
        vnp_TmnCode +
        "|" +
        vnp_TransactionType +
        "|" +
        vnp_TxnRef +
        "|" +
        vnp_Amount +
        "|" +
        vnp_TransactionNo +
        "|" +
        vnp_TransactionDate +
        "|" +
        vnp_CreateBy +
        "|" +
        vnp_CreateDate +
        "|" +
        vnp_IpAddr +
        "|" +
        vnp_OrderInfo;
    let hmac = crypto.createHmac("sha512", secretKey);
    let vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

    let dataObj = {
        vnp_RequestId: vnp_RequestId,
        vnp_Version: vnp_Version,
        vnp_Command: vnp_Command,
        vnp_TmnCode: vnp_TmnCode,
        vnp_TransactionType: vnp_TransactionType,
        vnp_TxnRef: vnp_TxnRef,
        vnp_Amount: vnp_Amount,
        vnp_TransactionNo: vnp_TransactionNo,
        vnp_CreateBy: vnp_CreateBy,
        vnp_OrderInfo: vnp_OrderInfo,
        vnp_TransactionDate: vnp_TransactionDate,
        vnp_CreateDate: vnp_CreateDate,
        vnp_IpAddr: vnp_IpAddr,
        vnp_SecureHash: vnp_SecureHash,
    };

    request(
        {
            url: vnp_Api,
            method: "POST",
            json: true,
            body: dataObj,
        },
        function (error, response, body) {
            console.log(response);
        }
    );
});

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort((a, b) => a.localeCompare(b));
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(
            /%20/g,
            "+"
        );
    }
    return sorted;
}

module.exports = {
    vnpayCreatePayment,
    vnpayIpn,
    vnpayQueryOrder,
    vnpayRefund,
    vnpayReturn,
};
