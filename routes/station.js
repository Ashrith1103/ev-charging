const express = require('express');
const router = express.Router();
const {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
} = require('../controllers/stationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/',     protect, getAllStations);
router.get('/:id',  protect, getStationById);
router.post('/',    protect, authorize('executive'), createStation);
router.put('/:id',  protect, authorize('executive'), updateStation);
router.delete('/:id', protect, authorize('executive'), deleteStation);

module.exports = router;