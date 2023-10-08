const router = require("express").Router();
const {
    getAllAddress,
    getAddress,
    updateAddress,
    deleteAddress,
} = require("../controller/address");

const Address = require("../models/Address");
const advancedResults = require("../middleware/advancedResults");

const { protect, authorize } = require("../middleware/auth");

router.route("/").get(
    advancedResults(Address, {
        path: "user",
        select: "name",
    }),
    getAllAddress
);

router
    .route("/:id")
    .get(getAddress)
    .put(protect, authorize("user", "admin"), updateAddress)
    .delete(protect, authorize("user", "admin"), deleteAddress);

module.exports = router;
