const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Momo = require("../models/Momo");
const Order = require("../models/Order");

//https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
//parameters
var accessKey = "F8BBA842ECF85";
var secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
var partnerCode = "MOMO";
var redirectUrl = "http://localhost:3000/result";
var ipnUrl = "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b";
var requestType = "payWithMethod";
var extraData = "";
var paymentCode =
    "T8Qii53fAXyUftPV3m9ysyRhEanUs9KlOPfHgpMR0ON50U10Bh+vZdpJU7VY4z+Z2y77fJHkoDc69scwwzLuW5MzeUKTwPo3ZMaB29imm6YulqnWfTkgzqRaion+EuD7FN9wZ4aXE1+mRt0gHsU193y+yxtRgpmY7SDMU9hCKoQtYyHsfFR5FUAOAKMdw2fzQqpToei3rnaYvZuYaxolprm9+/+WIETnPUDlxCYOiw7vPeaaYQQH0BF0TxyU3zu36ODx980rJvPAgtJzH1gUrlxcSS1HQeQ9ZaVM1eOK/jl8KJm6ijOwErHGbgf/hVymUQG65rHU2MWz9U8QUjvDWA==";
var orderGroupId = "";
var autoCapture = true;
var lang = "vi";

//before sign HMAC SHA256 with format
//accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType

//json object send to MoMo endpoint

// @desc    Create MoMo payment
// @route   POST /api/v1/payment/momo/create
// @access  Private
const momoCreatePayment = asyncHandler(async (req, res, next) => {
    var amount = "50000";
    var orderId = partnerCode + new Date().getTime();
    var requestId = orderId;
    var order = req.body.order;
    var orderInfo = req.body.orderInfo;

    var rawSignature =
        "accessKey=" +
        accessKey +
        "&amount=" +
        amount +
        "&extraData=" +
        extraData +
        "&ipnUrl=" +
        ipnUrl +
        "&orderId=" +
        orderId +
        "&orderInfo=" +
        orderInfo +
        "&partnerCode=" +
        partnerCode +
        "&redirectUrl=" +
        redirectUrl +
        "&requestId=" +
        requestId +
        "&requestType=" +
        requestType;
    //puts raw signature
    console.log("--------------------RAW SIGNATURE----------------");
    console.log(rawSignature);
    //signature
    const crypto = require("crypto");
    var signature = crypto
        .createHmac("sha256", secretKey)
        .update(rawSignature)
        .digest("hex");
    console.log("--------------------SIGNATURE----------------");
    console.log(signature);

    const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        partnerName: "Test",
        storeId: "MomoTestStore",
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        lang: lang,
        requestType: requestType,
        autoCapture: autoCapture,
        extraData: extraData,
        orderGroupId: orderGroupId,
        signature: signature,
    });

    // Them giao dich momo vao database
    const momo = await Momo.create({
        partnerCode: partnerCode,
        partnerName: "Test",
        storeId: "Aumart",
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        order: order,
    });

    const https = require("https");
    const options = {
        hostname: "test-payment.momo.vn",
        port: 443,
        path: "/v2/gateway/api/create",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(requestBody),
        },
    };
    // Send the request and get the response
    const momoReq = https.request(options, (response) => {
        console.log(`Status: ${response.statusCode}`);
        console.log(`Headers: ${JSON.stringify(response.headers)}`);
        response.setEncoding("utf8");
        response.on("data", (body) => {
            // return result to client
            res.status(response.statusCode).json({
                success: true,
                code: JSON.parse(body).resultCode,
                data: JSON.parse(body).shortLink,
                momo: momo,
            });

            console.log("Body: ");
            console.log(body);
            console.log("resultCode: ");
            console.log(JSON.parse(body).resultCode);
        });
        response.on("end", () => {
            console.log("No more data in response.");
        });
    });

    momoReq.on("error", (e) => {
        res.status(500).json({
            success: false,
            error: e.message,
        });
        console.log(`problem with request: ${e.message}`);
    });
    // write data to request body
    console.log("Sending....");
    momoReq.write(requestBody);
    momoReq.end();
});

// @desc    MoMo IPN
// @route   POST /api/v1/payment/momo/momo_ipn
// @access  Private
const momoIpn = asyncHandler(async (req, res, next) => {
    let momo_Params = req.query;
    let orderId = momo_Params["orderId"];
    let responseTime = momo_Params["responseTime"];
    let resultCode = momo_Params["resultCode"];

    const momo = await Momo.findOne({
        orderId: orderId,
    });
    const order = await Order.findById(momo.order);

    if (!momo) {
        return next(new ErrorResponse(`No momo found with id ${orderId}`, 404));
    }

    let paymentStatus = order.paymentState; // Trang thai cho thanh toan cua don hang: 0: Chua thanh toan, 1: Thanh toan thanh cong, 2: Thanh toan that bai

    if (paymentStatus == "Pending") {
        // Cap nhat ket qua giao dich momo vao database
        momo.responseTime = responseTime;
        momo.resultCode = resultCode;
        await momo.save();

        if (resultCode == "0") {
            paymentStatus = "Paid";

            // Cap nhat trang thai thanh toan cua don hang
            order.paymentState = paymentStatus;
            await order.save();

            res.status(200).json({
                success: true,
                rspcode: "00",
                message: "Confirm Success",
            });
        } else {
            paymentStatus = "Pending";

            // Cap nhat trang thai thanh toan cua don hang
            order.paymentState = paymentStatus;
            await order.save();

            res.status(200).json({
                success: true,
                rspcode: "01",
                message: "Confirm Failed",
            });
        }
    } else {
        res.status(200).json({
            success: true,
            rspcode: "02",
            message: "Order already confirmed",
        });
    }
});

module.exports = {
    momoCreatePayment,
    momoIpn,
};
