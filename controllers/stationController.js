const ChargingStation = require('../models/ChargingStation');
const User = require('../models/User');

// GET /api/stations
const getAllStations = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.connectorType) where.connectorType = req.query.connectorType;

    const stations = await ChargingStation.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ count: stations.length, stations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/stations/:id
const getStationById = async (req, res) => {
  try {
    const station = await ChargingStation.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    res.json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/stations
const createStation = async (req, res) => {
  try {
    const { name, locationName, latitude, longitude, status, powerOutput, connectorType } = req.body;

    if (!name || latitude == null || longitude == null || !powerOutput || !connectorType) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const station = await ChargingStation.create({
      name,
      locationName,
      latitude,
      longitude,
      status,
      powerOutput,
      connectorType,
      createdBy: req.user.id,
    });

    // Return with creator info
    const result = await ChargingStation.findByPk(station.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/stations/:id
const updateStation = async (req, res) => {
  try {
    const station = await ChargingStation.findByPk(req.params.id);

    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    const allowedFields = ['name', 'locationName', 'latitude', 'longitude', 'status', 'powerOutput', 'connectorType'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        station[field] = req.body[field];
      }
    });

    await station.save();

    const updated = await ChargingStation.findByPk(station.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
    });

    res.json(updated);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/stations/:id
const deleteStation = async (req, res) => {
  try {
    const station = await ChargingStation.findByPk(req.params.id);

    if (!station) {
      return res.status(404).json({ message: 'Station not found' });
    }

    await station.destroy();
    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
};