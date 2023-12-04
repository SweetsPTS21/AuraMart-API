const router = require('express').Router({ mergeParams: true });
const { getTopSoldProduct, getTopSoldOfShop } = require('../controller/stats');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/').get(authorize("admin"), getTopSoldOfShop);
router.route('/products').get(getTopSoldProduct);

module.exports = router;
