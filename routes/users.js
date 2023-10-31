const router = require("express").Router({ mergeParams: true });
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
} = require("../controller/users");

const { getUserVoucher, addUserVoucher, checkOwnerVoucher } = require("../controller/voucher");

const User = require("../models/User");
const advancedResults = require("../middleware/advancedResults");
const addressRouter = require("./address");

const { protect, authorize } = require("../middleware/auth");
const { getUserAddress, addAddress } = require("../controller/address");
const { getUserShop } = require("../controller/shops");
const UserVoucher = require("../models/UserVoucher");
router.use(protect);
// router.use(authorize("admin", "user"));

router.route("/").get(advancedResults(User), getUsers).post(createUser);

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

router
    .route("/:userId/address")
    .get(getUserAddress)
    .post(protect, authorize("user", "admin"), addAddress);

router
    .route("/:userId/shop")
    .get(protect, authorize("admin", "seller"), getUserShop);

router.route("/:userId/vouchers").get(advancedResults(UserVoucher, ["vouchers"]), getUserVoucher);

router
    .route("/:userId/vouchers/:id")
    .get(checkOwnerVoucher)
    .post(protect, authorize("user", "admin"), addUserVoucher);

module.exports = router;
