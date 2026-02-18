import React from 'react';

const Jobs = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Active Jobs</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <h3 className="font-bold text-lg">Kitchen Renovation</h3>
                    <p className="text-sm text-gray-500 mb-2">Customer: Sarah Smith</p>
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">In Progress</span>
                        <button className="text-blue-600 text-sm">Details</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Jobs;
