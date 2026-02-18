import React from 'react';
import { Plus } from 'lucide-react';

const Quotes = () => {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quotes</h1>
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded flex items-center gap-2">
                    <Plus size={20} /> Create Quote
                </button>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No quotes found. Create a new quote to get started.
            </div>
        </div>
    );
};

export default Quotes;
