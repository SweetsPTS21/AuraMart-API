const Product = require("../models/Product");
const Shop = require("../models/Shop");
const SaleProduct = require("../models/SaleProduct");
const Denunciation = require("../models/Denunciation");
const slugify = require("slugify");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const storage = require("../config/firebaseConfig");

const path = require("path");
const url = require("url");
const redis = require("redis");

const redis_client = redis.createClient({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
const getProducts = asyncHandler(async (req, res, next) => {
    const getUrl = url.parse(req.url, true).href;
    redis_client.setex(
        `products:${getUrl}`,
        process.env.CACHE_EXPIRE,
        JSON.stringify(res.advancedResults)
    );
    res.status(200).json(res.advancedResults);
});

// @desc    Get all products
// @route   GET /api/v1/shops/:shopId/products
// @access  Public
const getProductsOfShops = asyncHandler(async (req, res, next) => {
    const { shopId } = req.params;
    const products = await Product.find({ shop: shopId });

    // just cache in 5s to reduce the number of requests
    redis_client.setex(`products_shop:${shopId}`, 5, JSON.stringify(products));
    return res.status(200).json({
        success: true,
        total: products.length,
        data: products,
    });
});

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id).populate({
        path: "shop",
        select: "name description avatar",
    });

    if (!product) {
        return next(
            new ErrorResponse(
                `No product found with the id ${req.params.id}`,
                404
            )
        );
    }

    // if product is sale product => get sale product
    if (product.sale) {
        const saleProduct = await SaleProduct.findOne({ product: product._id });
        if (saleProduct) {
            const product_ = {
                ...product._doc,
                sale: saleProduct,
            };

            redis_client.setex(
                `productId:${req.params.id}`,
                60,
                JSON.stringify(product_)
            );
            return next(
                res.status(200).json({
                    success: true,
                    data: product_,
                })
            );
        }
    }

    // cached in redis in 1 minute
    redis_client.setex(
        `productId:${req.params.id}`,
        60,
        JSON.stringify(product)
    );

    res.status(200).json({
        success: true,
        data: product,
    });
});

// @desc    Add product
// @route   POST /api/v1/shops/:shopId/products
// @access  Private
const addProduct = asyncHandler(async (req, res, next) => {
    req.body.shop = req.params.shopId;
    req.body.user = req.user.id;

    const shop = await Shop.findById(req.params.shopId);

    if (!shop) {
        return next(
            new ErrorResponse(
                `No shop found with id of ${req.params.shopId}`,
                404
            )
        );
    }

    // Make sure that the owner is correct
    if (shop.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(
            new ErrorResponse(
                `User ${req.user.id} cannot add product to this shop ${shop._id}`,
                401
            )
        );
    }

    const products = req.body;

    products.forEach((product) => {
        setTimeout(() => {
            console.log(product);
        }, 200);
        product.shop = req.params.shopId;
        product.user = req.user.id;
        Product.create(product);
    });

    res.status(201).json({
        success: true,
        data: products,
    });
});

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    let shop = await Shop.findOne({ user: req.user.id });
    if (!product) {
        return next(
            new ErrorResponse(`No product found with id ${req.params.id}`, 404)
        );
    }

    // Make sure that the owner is correct
    if (
        product.shop.toString() !== shop._id &&
        req.user.role !== "admin" &&
        req.user.role !== "seller"
    ) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} cannot update product to this shop ${product.shop}`,
                401
            )
        );
    }

    // update product slug
    req.body.slug = slugify(req.body.name, {
        lower: true,
        remove: /[*+~.,/|()'"!:@]/g,
    });

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: req.body,
    });
});

// @dest   Set sale product
// @route  PUT /api/v1/shops/:shopId/products/:id
// @access Private
const setSaleProduct = asyncHandler(async (req, res, next) => {
    const { shopId, id } = req.params;
    const { sale, discount, quantity, soldQuantity, beginAt, endIn } = req.body;

    const shop = await Shop.findById(shopId);

    if (!shop) {
        return next(new ErrorResponse(`No shop with the id of ${shopId}`, 404));
    }

    // Make sure that the shop owner is correct
    if (shop.user.toString() !== req.user.id && req.user.role !== "user") {
        return next(
            new ErrorResponse(
                `User ${req.user.id} is not the owner of shop ${shop._id}`,
                401
            )
        );
    }

    const product = await Product.findById(id);

    if (!product) {
        return next(
            new ErrorResponse(`No product found with id ${req.params.id}`, 404)
        );
    }

    // Make sure that the product owner is correct
    if (product.shop.toString() !== shopId) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} cannot update product to this shop ${shop._id}`,
                401
            )
        );
    }

    // set sale status for product
    product.sale = sale;
    await product.save();

    // find sale product by product id
    const saleProduct = await SaleProduct.findOne({ product: id });

    // create sale product if not exist
    if (!saleProduct) {
        const newSale = await SaleProduct.create({
            product: id,
            sale,
            discount,
            quantity,
            soldQuantity,
            beginAt,
            endIn,
            user: req.user.id,
            shop: shopId,
        });
        return res.status(201).json({
            success: true,
            data: newSale,
        });
    }

    saleProduct.sale = sale;
    saleProduct.discount = discount;
    saleProduct.beginAt = beginAt;
    saleProduct.endIn = endIn;
    saleProduct.quantity = quantity;
    saleProduct.soldQuantity = soldQuantity;

    await saleProduct.save();

    res.status(200).json({
        success: true,
        data: saleProduct,
    });
});

// @desc    Get sale product
// @route   GET /api/v1/products/sale
// @access  Public
const getSaleProduct = asyncHandler(async (req, res, next) => {
    // Get sale products with sale=true and beginAt > today
    // Just get products in one week
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // populate with all fields of product
    const saleProducts = await SaleProduct.find({
        sale: true,
        beginAt: { $lte: nextWeek },
    }).populate({
        path: "product",
        select: "", // select all fields
        populate: {
            path: "shop",
            select: "name",
        },
    });

    // if today > (beginAt + 24h) => delete sale product
    for (const prod of saleProducts) {
        const { beginAt } = prod;
        const endDate = new Date(beginAt);
        endDate.setDate(endDate.getDate() + 1);

        if (today > endDate) {
            // Set product status to false
            await Product.findByIdAndUpdate(prod.product._id, { sale: false });

            // Delete sale product
            await SaleProduct.findByIdAndDelete(prod._id);

            // remove product from saleProducts
            saleProducts.splice(saleProducts.indexOf(prod), 1);
        }
    }

    // cached in redis in 2 minutes
    const getUrl = url.parse(req.url, true).href;
    redis_client.setex(
        `sale_products:${getUrl}`,
        120,
        JSON.stringify({
            total: saleProducts.length,
            pagination: {
                count: saleProducts.length,
                next: null,
                prev: null,
            },
            data: saleProducts,
        })
    );

    res.status(200).json({
        success: true,
        data: saleProducts,
    });
});

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    let shop = await Shop.findOne({ user: req.user.id });
    if (!product) {
        return next(
            new ErrorResponse(`No product found with id ${req.params.id}`, 404)
        );
    }

    // Make sure that the owner is correct
    if (
        product.shop.toString() !== shop._id &&
        req.user.role !== "admin" &&
        req.user.role !== "seller"
    ) {
        return next(
            new ErrorResponse(
                `User ${req.user.id} cannot update product to this shop ${product._id}`,
                401
            )
        );
    }

    await product.remove();

    res.status(200).json({
        success: true,
        data: {},
    });
});

// @desc    Upload photo for product
// @route   PUT /api/v1/products/:id/photo
// @access  Private
const productPhotoUpload = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    let shop = await Shop.findOne({ user: req.user.id });

    if (!product) {
        return res.status(400).json({ success: false });
    }

    // Make sure user is shop owner
    if (
        product.shop.toString() !== shop._id &&
        req.user.role !== "admin" &&
        req.user.role !== "seller"
    ) {
        return next(
            new ErrorResponse(
                `User ${req.params.id} cannot update this product`
            ),
            401
        );
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload an image file`, 400));
    }

    const file = req.files.file;

    console.log(file);

    // Make sure the image is a photo
    if (!file.mimetype.startsWith("image")) {
        return next(
            new ErrorResponse(
                `The file is not an image, please check again!`,
                404
            )
        );
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(`The file size cannot be larger than 3MB!`, 404)
        );
    }

    // Change the name of the photo so that it is not duplicated
    file.name = `photo_${product._id}${path.parse(file.name).ext}`;

    // file.mv(`${process.env.FILE_UPLOAD_PATH2}/${file.name}`, async (err) => {
    //     if (err) {
    //         console.error(err);
    //         return next(new ErrorResponse(`Problem with file upload`, 500));
    //     }
    //     await Product.findByIdAndUpdate(req.params.id, { photo: file.name });

    //     res.status(200).json({
    //         success: true,
    //         data: file.name,
    //     });
    // });

    const storageRef = ref(
        storage,
        `images/products/${product._id}/photo_${path.parse(file.name).ext}`
    );

    try {
        const snapshot = await uploadBytes(storageRef, file);

        const url = await getDownloadURL(snapshot.ref);

        res.status(200).json({
            success: true,
            data: file.name,
            url: url,
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return next(new ErrorResponse(`Problem with file upload`, 500));
    } finally {
        // setTimeout(msg, 1);
    }
});

// @desc    Report product
// @route   POST /api/v1/products/:id/report
// @access  Private
const reportProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(
            new ErrorResponse(`Không tìm thấy sản phẩm ${req.params.id}`, 404)
        );
    }

    // check if user already reported this product
    const check = await Denunciation.findOne({
        product: req.params.id,
        user: req.user.id,
    });

    if (check) {
        return next(
            new ErrorResponse(
                `Bạn đã báo cáo sản phẩm này rồi, vui lòng chờ xử lý!`,
                400
            )
        );
    }

    // add denunciation
    const denunciationData = {
        reason: req.body.reason,
        description: req.body.description,
        product: req.params.id,
        user: req.user.id,
    };

    const denunciation = await Denunciation.create(denunciationData);

    res.status(200).json({
        success: true,
        data: denunciation,
    });
});

module.exports = {
    getProducts,
    getProductsOfShops,
    getProduct,
    addProduct,
    updateProduct,
    setSaleProduct,
    getSaleProduct,
    deleteProduct,
    productPhotoUpload,
    reportProduct,
};
