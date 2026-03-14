const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

// Must load models so Sequelize registers associations before sync
require('./models/User');
require('./models/ChargingStation');
require('./models/ExecutiveProfile');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/station'));
app.use('/api/executive', require('./routes/executiveProfile'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'EV Charging Station API (MySQL) is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
