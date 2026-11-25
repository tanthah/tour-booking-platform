const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const wishlistController = require('./wishlist.controller');
const { tourIdValidation } = require('./wishlist.validation');

router.use(authenticate, authorize('CUSTOMER'));

router.get('/', wishlistController.getWishlist);
router.put('/:tourId', tourIdValidation, validate, wishlistController.addTour);
router.delete('/:tourId', tourIdValidation, validate, wishlistController.removeTour);

module.exports = router;
