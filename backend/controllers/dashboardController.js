const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');
const Worker = require('../models/Worker');
const Quote = require('../models/Quote');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
    // 1. Active Projects (In Progress)
    const activeProjectsCount = await Job.countDocuments({ status: 'In Progress' });

    // 2. Active Workers (Total workers)
    const activeWorkersCount = await Worker.countDocuments({});
    // Alternatively, if you want only available workers: { availability: 'Available' }

    // 3. Pending Quotes
    const pendingQuotesCount = await Quote.countDocuments({ status: 'Pending' });

    // 4. Total Revenue (Sum of completed and in-progress jobs/quotes)
    // Assuming revenue comes from Quotes linked to these jobs
    // For simplicity, we can sum up all "Approved" quotes for now, or use a more complex aggregation
    const revenueResult = await Quote.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // 5. Recent Projects (Limit 5)
    const recentProjects = await Job.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedWorkers', 'name');

    // 6. Monthly Revenue (Mock or Aggregation)
    // For this MVP, we'll keep the mock data structure for the chart but can populate it later
    const monthlyRevenue = [
        { name: 'Jan', revenue: 4000, projects: 2 },
        { name: 'Feb', revenue: 3000, projects: 1 },
        { name: 'Mar', revenue: 2000, projects: 3 },
        { name: 'Apr', revenue: 2780, projects: 2 },
        { name: 'May', revenue: 1890, projects: 1 },
        { name: 'Jun', revenue: 2390, projects: 2 },
    ];

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
