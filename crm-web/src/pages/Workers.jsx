import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import WorkerForm from '../components/forms/WorkerForm';
import { User, Phone, Mail, Hammer, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Workers = () => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState(null);

    const fetchWorkers = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/workers');
            setWorkers(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch workers');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const handleCreateWorker = () => {
        setEditingWorker(null);
        setIsModalOpen(true);
    };

    const handleEditWorker = (worker) => {
        setEditingWorker(worker);
        setIsModalOpen(true);
    };

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        fetchWorkers();
    };

    const getAvailabilityColor = (status) => {
        switch (status) {
            case 'Available': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'Busy': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'On Leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading && workers.length === 0) return <div className="p-4 text-center text-gray-600 dark:text-gray-400">Loading workers...</div>;
    if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Worker Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team and their availability</p>
                </div>
                <button
                    onClick={handleCreateWorker}
                    className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition-colors"
                >
                    <User size={18} className="mr-2" />
                    <span>Add Worker</span>
                </button>
            </div>

            {workers.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400">No workers found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((worker) => (
                        <div key={worker._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                        {worker.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{worker.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">£{worker.hourlyRate}/hr</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(worker.availability)}`}>
                                    {worker.availability}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Mail size={16} className="mr-3" />
                                    <span>{worker.email}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Phone size={16} className="mr-3" />
                                    <span>{worker.phone}</span>
                                </div>
                                <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                                    <Hammer size={16} className="mr-3 mt-1" />
                                    <div className="flex flex-wrap gap-1">
                                        {worker.skills.map((skill, index) => (
                                            <span key={index} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {worker.currentJob && (
                                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                        <Clock size={16} className="mr-2" />
                                        <span>Working on: {worker.currentJob.title}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-2">
                                <button
                                    onClick={() => handleEditWorker(worker)}
                                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => navigate(`/workers/${worker._id}`)}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingWorker ? 'Edit Worker' : 'Add New Worker'}
            >
                <WorkerForm
                    worker={editingWorker}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Workers;
