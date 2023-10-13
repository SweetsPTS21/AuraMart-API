const router = require("express").Router();

const {
    getShops,
    getShop,
    createShop,
    updateShop,
    deleteShop,
} = require("../controller/shops");

const {
    getShopConfigs,
    addShopConfig,
    updateShopConfig,
    deleteShopConfig,
} = require("../controller/configs");

const { getProductsOfShops, addProduct } = require("../controller/products");

const advancedResults = require("../middleware/advancedResults");
const Shop = require("../models/Shop");

const { protect, authorize } = require("../middleware/auth");

const { checkCachedShopProducts } = require("../middleware/redisProducts");

// Include other resource routers
const productRouter = require("./products");
const orderRouter = require("./orders");
const statRouter = require("./stats");
const { get } = require("mongoose");
// Reroute into other resoure routers
router.use("/:shopId/orders", orderRouter);
router.use("/:shopId/stats", statRouter);

router
    .route("/")
    .get(advancedResults(Shop, "products"), getShops)
    .post(protect, authorize("seller", "admin"), createShop);

router
    .route("/:shopId/products")
    .get(checkCachedShopProducts, getProductsOfShops);

router
    .route("/:shopId/products")
    .post(protect, authorize("seller", "admin"), addProduct);

router
    .route("/:id")
    .get(getShop)
    .put(protect, authorize("seller", "admin"), updateShop)
    .delete(protect, authorize("seller", "admin"), deleteShop);

router
    .route("/:shopId/configs")
    .get(protect, authorize("seller", "admin"), getShopConfigs)
    .post(protect, authorize("seller", "admin"), addShopConfig);

router
    .route("/:shopId/configs/:id")
    .put(protect, authorize("seller", "admin"), updateShopConfig)
    .delete(protect, authorize("seller", "admin"), deleteShopConfig);

module.exports = router;
