const router = require('express').Router({ mergeParams: true });
const {
  getOrders,
  getUserOrders,
  getOrder,
  addOrder,
  updateOrder,
  deleteOrder
} = require('../controller/orders');

const advancedResults = require('../middleware/advancedResults');
const Order = require('../models/Order');

const { protect, authorize } = require('../middleware/auth');

router.route('/').get(
  advancedResults(Order, {
    path: 'product shop user',
    select: 'name'
  }),
  getOrders
);

router.route('/history').get(protect, authorize('user', 'admin'), getUserOrders);

router
  .route('/:id')
  .get(getOrder)
  .put(protect, authorize('user', 'seller', 'admin'), updateOrder)
  .delete(protect, authorize('user','seller', 'admin'), deleteOrder);

router.route('/checkout').post(protect, authorize('user', 'seller', 'admin'), addOrder);

module.exports = router;
