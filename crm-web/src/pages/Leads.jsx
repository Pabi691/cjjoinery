import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';

const leadsData = [
    { id: 1, customerName: 'John Doe', service: 'Bespoke Wardrobe', status: 'New', date: '2023-10-25' },
    { id: 2, customerName: 'Sarah Smith', service: 'Kitchen Installation', status: 'Contacted', date: '2023-10-24' },
    { id: 3, customerName: 'Mike Johnson', service: 'Media Wall', status: 'Quoted', date: '2023-10-23' },
];

const Leads = () => {
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLeads(leadsData);
            setLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-gray-500 font-medium mb-1 dark:text-gray-400">View and manage your leads</p>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Leads Management</h1>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all hover:-translate-y-0.5">
                    <Plus size={20} /> New Lead
                </button>
            </div>

            <div className="glass-panel rounded-2xl p-4 mb-8 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        className="w-full pl-12 pr-4 py-3 bg-white/40 dark:bg-slate-800/40 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                </div>
                <button className="border border-white/40 dark:border-white/10 px-6 py-3 rounded-xl flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 transition-colors font-medium">
                    <Filter size={20} /> Filter
                </button>
            </div>

            {loading ? (
                <div className="glass-panel rounded-3xl overflow-hidden animate-pulse">
                    <div className="h-16 bg-gray-100/50 dark:bg-slate-800/50 w-full border-b border-gray-200/50"></div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-20 w-full border-b border-gray-200/30 flex items-center px-6 space-x-6">
                            <div className="h-4 w-1/4 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-1/4 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                            <div className="h-4 w-1/6 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                            <div className="h-6 w-16 bg-gray-200/50 dark:bg-slate-700/50 rounded-full"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel rounded-3xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                        <thead className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Service</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                            {leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-white/40 dark:hover:bg-gray-700/40 transition-colors">
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{lead.customerName}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{lead.service}</td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{lead.date}</td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${lead.status === 'New' ? 'bg-blue-100/80 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                                                lead.status === 'Contacted' ? 'bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                                    'bg-green-100/80 text-green-800 dark:bg-green-900/40 dark:text-green-300'}`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                        <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 font-medium">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Leads;
