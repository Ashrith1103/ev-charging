const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const ChargingStation = sequelize.define(
  'ChargingStation',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Station name is required' },
      },
    },
    locationName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: { args: [-90], msg: 'Latitude must be >= -90' },
        max: { args: [90],  msg: 'Latitude must be <= 90'  },
        notNull: { msg: 'Latitude is required' },
      },
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      validate: {
        min: { args: [-180], msg: 'Longitude must be >= -180' },
        max: { args: [180],  msg: 'Longitude must be <= 180'  },
        notNull: { msg: 'Longitude is required' },
      },
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',
      allowNull: false,
    },
    powerOutput: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Power output must be a positive number' },
        notNull: { msg: 'Power output (kW) is required' },
      },
    },
    connectorType: {
      type: DataTypes.ENUM('Type 1', 'Type 2', 'CCS', 'CHAdeMO', 'Tesla'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Connector type is required' },
      },
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    tableName: 'charging_stations',
    timestamps: true,
  }
);

// Associations
ChargingStation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(ChargingStation, { foreignKey: 'createdBy', as: 'stations' });

module.exports = ChargingStation;