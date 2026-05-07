const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config();

connectDB().catch(err => {
    console.error('Database connection failed (Check IP Whitelist in Atlas):', err.message);
    // process.exit(1); // Keep server running for diagnostics
});
// console.log('MOCK MODE: Database connection disabled.');

const app = express();

app.use(express.json());
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/workers', require('./routes/workerRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/worker', require('./routes/workerAppRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/trash', require('./routes/trashRoutes'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.get('/api/health', (req, res) => {
    const report = () => res.json({
        dbState: mongoose.connection.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
        dbName: mongoose.connection.name || null
    });

    if (mongoose.connection.readyState === 1) {
        return report();
    }

    connectDB()
        .then(report)
        .catch(report);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

module.exports = app;
