import React from 'react';

const Dashboard = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">£12,450</p>
                <div className="mt-4 text-green-600 text-sm flex items-center">
                    <span>+12% from last month</span>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">New Leads</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">24</p>
                <div className="mt-4 text-green-600 text-sm flex items-center">
                    <span>+5 new today</span>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-500 text-sm font-medium">Active Jobs</h3>
                <p className="text-3xl font-bold text-gray-800 mt-2">8</p>
                <div className="mt-4 text-yellow-600 text-sm flex items-center">
                    <span>2 ending this week</span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
