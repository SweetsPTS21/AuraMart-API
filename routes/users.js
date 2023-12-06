const router = require("express").Router({ mergeParams: true });
const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    createBulkUsers,
} = require("../controller/users");

const {
    getUserVoucher,
    addUserVoucher,
    checkOwnerVoucher,
} = require("../controller/voucher");

const { getUserReviews } = require("../controller/reviews");

const { getUserOrders } = require("../controller/orders");

const User = require("../models/User");
const advancedResults = require("../middleware/advancedResults");
const addressRouter = require("./address");

const { protect, authorize } = require("../middleware/auth");
const { getUserAddress, addAddress } = require("../controller/address");
const { getUserShop } = require("../controller/shops");
const UserVoucher = require("../models/UserVoucher");
router.use(protect);
// router.use(authorize("admin", "user"));

router
    .route("/")
    .get(authorize("admin"), advancedResults(User), getUsers)
    .post(authorize("admin"), createUser);

router.route("/bulk").post(authorize("admin"), createBulkUsers);

router
    .route("/:id")
    .get(authorize("admin"), getUser)
    .put(authorize("admin"), updateUser)
    .delete(authorize("admin"), deleteUser);

router
    .route("/:userId/address")
    .get(getUserAddress)
    .post(protect, authorize("user", "admin"), addAddress);

router.route("/:userId/orders").get(getUserOrders);

router
    .route("/:userId/shop")
    .get(protect, authorize("admin", "seller"), getUserShop);

router
    .route("/:userId/vouchers")
    .get(advancedResults(UserVoucher, ["vouchers"]), getUserVoucher);

router
    .route("/:userId/vouchers/:id")
    .get(checkOwnerVoucher)
    .post(protect, authorize("user", "admin"), addUserVoucher);

router.route("/:userId/reviews").get(protect, getUserReviews);

module.exports = router;
