const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: { msg: 'Email already registered' },
      validate: {
        isEmail: { msg: 'Must be a valid email' },
        notEmpty: { msg: 'Email is required' },
      },
    },
    role: {
      type: DataTypes.ENUM('executive', 'customer'),
      allowNull: false,
      defaultValue: 'customer',
      validate: {
        isIn: {
          args: [['executive', 'customer']],
          msg: 'Role must be either executive or customer',
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: { args: [6, 255], msg: 'Password must be at least 6 characters' },
      },
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

// Instance method to compare passwords
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;