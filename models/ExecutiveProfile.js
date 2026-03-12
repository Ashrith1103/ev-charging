const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const ExecutiveProfile = sequelize.define(
  'ExecutiveProfile',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    employeeCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: { msg: 'Employee code already exists' },
      validate: {
        notEmpty: { msg: 'Employee code is required' },
      },
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    officeLocation: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(25),
      allowNull: true,
    },
    yearsExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Years of experience must be 0 or more' },
      },
    },
  },
  {
    tableName: 'executive_profiles',
    timestamps: true,
  }
);

User.hasOne(ExecutiveProfile, { foreignKey: 'userId', as: 'executiveProfile' });
ExecutiveProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = ExecutiveProfile;
