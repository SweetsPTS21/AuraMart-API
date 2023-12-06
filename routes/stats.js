const router = require('express').Router({ mergeParams: true });
const { getTopSoldProduct, getTopSoldOfShop } = require('../controller/stats');

const { protect, authorize } = require('../middleware/auth');


router.route('/').get(protect, authorize("admin"), getTopSoldOfShop);
router.route('/products').get(getTopSoldProduct);

module.exports = router;
