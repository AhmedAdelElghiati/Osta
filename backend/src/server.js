const dotenv = require('dotenv');
const app = require('./app');
const { connectDatabase } = require('./config/database');

dotenv.config();

const startServer = async () => {
  try {
    await connectDatabase();
    const port = Number(5001);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
