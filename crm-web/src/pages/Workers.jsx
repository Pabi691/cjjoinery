import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import WorkerForm from '../components/forms/WorkerForm';
import { User, Phone, Mail, Hammer, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAvailabilityColor, normalizeWorker } from '../utils/workerStatus';

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
            setWorkers((data || []).map(normalizeWorker));
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

    if (loading && workers.length === 0) return (
        <div className="space-y-8">
            <div className="h-8 w-48 bg-white/40 dark:bg-slate-800/40 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="glass-panel p-6 rounded-3xl h-40 animate-pulse flex flex-col justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200/50 dark:bg-slate-700/50"></div>
                            <div className="space-y-3 flex-1">
                                <div className="h-4 w-3/4 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                            </div>
                        </div>
                        <div className="h-8 w-24 bg-gray-200/50 dark:bg-slate-700/50 rounded-lg mt-4"></div>
                    </div>
                ))}
            </div>
        </div>
    );
    if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <p className="text-gray-500 font-medium mb-1 dark:text-gray-400">Manage your team and their availability</p>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Worker Management</h1>
                </div>
                <button
                    onClick={handleCreateWorker}
                    className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all hover:-translate-y-0.5"
                >
                    <User size={20} /> Add Worker
                </button>
            </div>

            {workers.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400">No workers found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((worker) => (
                        <div key={worker._id} className="glass-panel rounded-3xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 p-8">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700/50 pb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xl shadow-inner">
                                        {worker.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">{worker.name}</h3>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">£{worker.hourlyRate}/hr</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getAvailabilityColor(worker.availability)}`}>
                                    {worker.availability}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <Mail size={16} className="mr-3" />
                                    <span>{worker.email}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <User size={16} className="mr-3" />
                                    <span>Login: {worker.username || worker.email?.split('@')?.[0] || 'Not assigned'}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <AlertCircle size={16} className="mr-3" />
                                    <span>Password: Securely stored</span>
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
