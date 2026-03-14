const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to DB first, then start server
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('Startup error:', error.message);
    process.exit(1);
  });