const Product = require("../models/Product");
const Shop = require("../models/Shop");
const SaleProduct = require("../models/SaleProduct");
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

    redis_client.setex(
        `products_shop:${shopId}`,
        process.env.CACHE_EXPIRE,
        JSON.stringify(products)
    );
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
        s;
    }

    redis_client.setex(
        `productId:${req.params.id}`,
        process.env.CACHE_EXPIRE,
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

module.exports = {
    getProducts,
    getProductsOfShops,
    getProduct,
    addProduct,
    updateProduct,
    setSaleProduct,
    deleteProduct,
    productPhotoUpload,
};
