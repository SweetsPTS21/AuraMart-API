const router = require('express').Router({ mergeParams: true });
const { getTopSoldProduct, getTopSoldOfShop } = require('../controller/stats');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getTopSoldOfShop);
router.route('/products').get(getTopSoldProduct);

module.exports = router;
