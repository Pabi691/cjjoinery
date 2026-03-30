import React, { useState, useEffect } from 'react';

const jobsData = [
    { id: 1, title: 'Kitchen Renovation', customer: 'Sarah Smith', status: 'In Progress' },
    { id: 2, title: 'Bespoke Wardrobe', customer: 'John Doe', status: 'Scheduled' },
    { id: 3, title: 'Media Wall Install', customer: 'Mike Johnson', status: 'Completed' },
];

const Jobs = () => {
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setJobs(jobsData);
            setLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="p-6">
            <div className="mb-8">
                <p className="text-gray-500 font-medium mb-1 dark:text-gray-400">Track all active work</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Active Jobs</h1>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-panel p-6 rounded-3xl h-40 animate-pulse flex flex-col justify-between border-l-4 border-indigo-500/50">
                            <div className="space-y-3">
                                <div className="h-5 w-3/4 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <div className="h-6 w-20 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                                <div className="h-4 w-16 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="glass-panel rounded-3xl p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-all hover:-translate-y-1">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{job.title}</h3>
                            <p className="text-sm text-gray-500 mb-2 dark:text-gray-400">Customer: {job.customer}</p>
                            <div className="flex justify-between items-center mt-6">
                                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                                    job.status === 'Completed' ? 'bg-green-100/80 text-green-800' :
                                    job.status === 'In Progress' ? 'bg-blue-100/80 text-blue-800' : 
                                    'bg-gray-100/80 text-gray-800'
                                }`}>
                                    {job.status}
                                </span>
                                <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">View Details</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Jobs;
