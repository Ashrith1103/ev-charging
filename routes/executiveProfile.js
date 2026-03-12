const express = require('express');
const router = express.Router();
const {
  getMyExecutiveProfile,
  createExecutiveProfile,
  updateExecutiveProfile,
  deleteExecutiveProfile,
} = require('../controllers/executiveProfileController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, authorize('executive'), getMyExecutiveProfile);
router.post('/profile', protect, authorize('executive'), createExecutiveProfile);
router.put('/profile', protect, authorize('executive'), updateExecutiveProfile);
router.delete('/profile', protect, authorize('executive'), deleteExecutiveProfile);

module.exports = router;
