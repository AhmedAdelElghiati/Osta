const dotenv = require('dotenv');
const http = require('http');
const app = require('./app');
const { connectDatabase } = require('./config/database');
const { attachChatSocket } = require('./services/chatSocket');

dotenv.config();

const startServer = async () => {
  try {
    await connectDatabase();
    const port = Number(5009);
    const server = http.createServer(app);
    attachChatSocket(server, app);
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
