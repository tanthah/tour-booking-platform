const express = require('express');
const router = express.Router();
const journeyAdminController = require('./journeyAdmin.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  journeyIdValidation,
  createJourneyValidation,
  assignGuideValidation,
  cancelJourneyValidation,
  listJourneysQueryValidation,
} = require('./journey.validation');

// Tất cả routes quản trị hành trình yêu cầu đăng nhập và quyền ADMIN
router.use(authenticate, authorize('ADMIN'));

router.get('/', listJourneysQueryValidation, validate, journeyAdminController.listAllJourneys);
router.get('/available-departures', journeyAdminController.getAvailableDepartures);
router.get('/guides', journeyAdminController.getAvailableGuides);
router.post('/create', createJourneyValidation, validate, journeyAdminController.createJourney);

router.get('/:journeyId', journeyIdValidation, validate, journeyAdminController.getJourneyDetailAdmin);
router.get('/:journeyId/logs', journeyIdValidation, validate, journeyAdminController.getJourneyLogs);
router.patch('/:journeyId/assign-guide', assignGuideValidation, validate, journeyAdminController.assignGuide);
router.patch('/:journeyId/cancel', cancelJourneyValidation, validate, journeyAdminController.cancelJourney);

module.exports = router;

