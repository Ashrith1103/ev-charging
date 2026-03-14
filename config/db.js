const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  await sequelize.authenticate();
  console.log('MySQL Connected successfully.');

  // Sync all models (creates tables if they don't exist)
  await sequelize.sync({ alter: true });
  console.log('All models synced with database.');

  isConnected = true;
};

module.exports = { sequelize, connectDB };