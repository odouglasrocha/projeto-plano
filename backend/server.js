const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const machineRoutes = require('./routes/machines');
const operatorRoutes = require('./routes/operators');
const productionOrderRoutes = require('./routes/production-orders');
const productionRecordRoutes = require('./routes/production-records');
const downtimeTypeRoutes = require('./routes/downtime-types');
const lossTypeRoutes = require('./routes/loss-types');
const materialLossRoutes = require('./routes/material-losses');
const reportRoutes = require('./routes/reports');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/production-orders', productionOrderRoutes);
app.use('/api/production-records', productionRecordRoutes);
app.use('/api/downtime-types', downtimeTypeRoutes);
app.use('/api/loss-types', lossTypeRoutes);
app.use('/api/material-losses', materialLossRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});