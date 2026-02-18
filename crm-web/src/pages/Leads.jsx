import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';

// Mock data
const leads = [
    { id: 1, customerName: 'John Doe', service: 'Bespoke Wardrobe', status: 'New', date: '2023-10-25' },
    { id: 2, customerName: 'Sarah Smith', service: 'Kitchen Installation', status: 'Contacted', date: '2023-10-24' },
    { id: 3, customerName: 'Mike Johnson', service: 'Media Wall', status: 'Quoted', date: '2023-10-23' },
];

const Leads = () => {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Leads Management</h1>
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center gap-2">
                    <Plus size={20} /> New Lead
                </button>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <button className="border px-4 py-2 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-50">
                    <Filter size={20} /> Filter
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.customerName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.service}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                            lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'}`}>
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-orange-600 hover:text-orange-900">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leads;
