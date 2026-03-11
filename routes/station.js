const express = require('express');
const router = express.Router();
const {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
} = require('../controllers/stationController');
const { protect } = require('../middleware/auth');

router.get('/',     protect, getAllStations);
router.get('/:id',  protect, getStationById);
router.post('/',    protect, createStation);
router.put('/:id',  protect, updateStation);
router.delete('/:id', protect, deleteStation);

module.exports = router;