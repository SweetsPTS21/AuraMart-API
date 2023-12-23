const redis = require("redis");
const url = require("url");

const redis_client = redis.createClient({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});

const checkCachedShopProducts = (req, res, next) => {
    const { shopId } = req.params;

    redis_client.get(`products_shop:${shopId}`, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }

        if (data != null) {
            data = JSON.parse(data);
            res.status(200).json({
                success: true,
                source: "Redis. Is this faster???",
                total: data.length,
                data,
            });
        } else {
            next();
        }
    });
};

const checkCacheSaleProducts = (req, res, next) => {
    const getUrl = url.parse(req.url, true).href;
    redis_client.get(`sale_products:${getUrl}`, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }

        if (data != null) {
            data = JSON.parse(data);
            res.status(200).json({
                success: true,
                source: "Redis. Is this faster???",
                total: data.total,
                pagination: data.pagination,
                data: data.data,
            });
        } else {
            next();
        }
    });
};

const checkCachedAllProducts = (req, res, next) => {
    const getUrl = url.parse(req.url, true).href;
    redis_client.get(`products:${getUrl}`, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }

        if (data != null) {
            data = JSON.parse(data);
            res.status(200).json({
                success: true,
                source: "Redis. Is this faster???",
                total: data.total,
                pagination: data.pagination,
                data: data.data,
            });
        } else {
            next();
        }
    });
};

const checkCachedSingleProduct = (req, res, next) => {
    const { id } = req.params;

    redis_client.get(`productId:${id}`, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }

        if (data != null) {
            data = JSON.parse(data);
            res.status(200).json({
                success: true,
                source: "Redis. Is this faster???",
                data,
            });
        } else {
            next();
        }
    });
};

const checkCachedProductReview = (req, res, next) => {
    const { productId } = req.params;

    redis_client.get(`reviews_product:${productId}`, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        }

        if (data != null) {
            data = JSON.parse(data);
            res.status(200).json({
                success: true,
                source: "Redis. Is this faster???",
                data,
            });
        } else {
            next();
        }
    });
};

module.exports = {
    checkCachedShopProducts,
    checkCacheSaleProducts,
    checkCachedAllProducts,
    checkCachedSingleProduct,
    checkCachedProductReview,
};
