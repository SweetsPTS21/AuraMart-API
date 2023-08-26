const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a title for the review'],
    maxlength: [100, 'Title cannot be longer than 100 characters']
  },
  text: {
    type: String,
    required: [true, 'Please add some text']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
});

// Allow only 1 review / 1 user
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Calculate average rating
ReviewSchema.statics.getAverageRating = async function(productId) {
  const obj = await this.aggregate([
    {
      $match: { product: productId }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    await this.model('Product').findByIdAndUpdate(productId, {
      averageRating: Math.ceil(obj[0].averageRating)
    });
  } catch (error) {
    console.error(error);
  }
};

// Call getAverageRating after save a new review
ReviewSchema.post('save', function() {
  this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after remove a review
ReviewSchema.pre('remove', function() {
  this.constructor.getAverageReview(this.product);
  console.log('Hello run in remove middleware');
});

module.exports = mongoose.model('Review', ReviewSchema);
