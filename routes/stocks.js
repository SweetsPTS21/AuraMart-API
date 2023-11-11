const router = require("express").Router();
const {
    getAllStocks,
    getStock,
    createStock,
    updateStock,
    deleteStock,
} = require("../controller/stocks");

const Stock = require("../models/Stock");
const advancedResults = require("../middleware/advancedResults");

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(
    advancedResults(Stock, {
        path: "products",
        select: "name price",
    }),
    getAllStocks
);

module.exports = router;
