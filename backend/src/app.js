const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const serviceRequestRoutes = require('./routes/serviceRequest.routes');
const craftRoutes = require('./routes/craft.routes');
const artisanRoutes = require('./routes/artisan.routes');
const offerRoutes = require('./routes/offer.routes');
const userRoutes = require('./routes/user.routes');
const contactRoutes = require('./routes/contact.routes');
const walletRoutes = require('./routes/wallet.routes');
const marketRoutes = require('./routes/market.routes');
const reviewRoutes = require('./routes/review.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const swaggerDocument = require('./config/swagger');

dotenv.config();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:4200',
    credentials: true,
  })
);
app.use((req, res, next) => {
  if (req.headers['content-type']) {
    req.headers['content-type'] = req.headers['content-type'].replace(/charset=UTF-8/gi, 'charset=utf-8');
  }
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Osta Marketplace API Documentation',
  swaggerOptions: { persistAuthorization: true },
}));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v1/requests', serviceRequestRoutes);
app.use('/api/v1/crafts', craftRoutes);
app.use('/api/v1/artisans', artisanRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1', reviewRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
