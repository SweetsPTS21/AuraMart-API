const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");
const ShopConfig = require("../models/ShopConfig");

const { getConfigs } = require("../controller/configs");

router
    .route("/")
    .get(
        advancedResults(ShopConfig, { path: "shop", select: "name" }),
        getConfigs
    );

module.exports = router;
