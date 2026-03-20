const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Quote = require('../models/Quote');

const canUseDb = () => mongoose.connection && mongoose.connection.readyState === 1;

const ensureDb = async () => {
    if (!canUseDb()) {
        await connectDB();
    }
    return canUseDb();
};

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const activeProjectsCount = await Job.countDocuments({
        status: 'In Progress'
    });

    const activeWorkersCount = await Worker.countDocuments({
        $or: [
            { status: { $in: ['Active', 'Available'] } },
            { availability: 'Available' }
        ]
    });

    const pendingQuotesCount = await Quote.countDocuments({
        status: 'Pending'
    });

    const revenueAgg = await Quote.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const recentProjects = await Job.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthSeed = [];
    for (let i = 5; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthSeed.push({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            name: d.toLocaleString('en-US', { month: 'short' }),
            revenue: 0,
            projects: 0
        });
    }

    const monthlyAgg = await Quote.aggregate([
        {
            $match: {
                status: 'Approved',
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                revenue: { $sum: '$total' },
                projects: { $sum: 1 }
            }
        }
    ]);

    const monthlyRevenue = monthSeed.map((month) => {
        const match = monthlyAgg.find(
            (item) => item._id.year === month.year && item._id.month === month.month
        );
        return {
            name: month.name,
            revenue: match?.revenue || 0,
            projects: match?.projects || 0
        };
    });

    res.json({
        activeProjects: activeProjectsCount,
        activeWorkers: activeWorkersCount,
        pendingQuotes: pendingQuotesCount,
        totalRevenue,
        recentProjects,
        monthlyRevenue
    });
});

module.exports = { getDashboardSummary };
