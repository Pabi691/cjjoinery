const asyncHandler = require('express-async-handler');
const mockData = require('../data/mockData');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = asyncHandler(async (req, res) => {
    // MOCK DATA CALCULATIONS
    const activeProjectsCount = mockData.jobs.filter(j => j.status === 'In Progress').length;
    const activeWorkersCount = mockData.workers.filter(w => w.status === 'Active' || w.status === 'Available').length;
    const pendingQuotesCount = mockData.quotes.filter(q => q.status === 'Pending').length;

    // Calculate Total Revenue from Approved Quotes
    const totalRevenue = mockData.quotes
        .filter(q => q.status === 'Approved')
        .reduce((sum, q) => sum + q.total, 0);

    const recentProjects = mockData.jobs.slice(0, 5); // Just take first 5 for now

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
