import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { Calendar, Users, CheckCircle, Clock, AlertCircle, ArrowLeft, Package, User } from 'lucide-react';
import { DateTime } from 'luxon';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data } = await axios.get(`/jobs/${id}`);
                setProject(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch project details');
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Scheduled': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-600 dark:text-gray-400">Loading details...</div>;
    if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;
    if (!project) return <div className="p-4 text-center">Project not found</div>;

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Projects
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Timelines</h3>
                            <div className="space-y-2">
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <Calendar size={18} className="mr-3 text-indigo-600 dark:text-indigo-400" />
                                    <span>Start Date: {project.startDate ? DateTime.fromISO(project.startDate).toLocaleString(DateTime.DATE_MED) : 'Not set'}</span>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <Clock size={18} className="mr-3 text-indigo-600 dark:text-indigo-400" />
                                    <span>Deadline: {project.deadline ? DateTime.fromISO(project.deadline).toLocaleString(DateTime.DATE_MED) : 'No deadline'}</span>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                    <Clock size={18} className="mr-3 text-indigo-600 dark:text-indigo-400" />
                                    <span>Expected Time: {project.expectedHours ? `${project.expectedHours} hours` : 'Not set'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Info</h3>
                            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mr-3">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{project.customerId?.name || 'Unknown Customer'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{project.customerId?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assigned Team</h3>
                            {project.assignedWorkers && project.assignedWorkers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {project.assignedWorkers.map((worker) => (
                                        <div
                                            key={worker._id}
                                            onClick={() => navigate(`/workers/${worker._id}`)}
                                            className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs mr-3">
                                                {worker?.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{worker?.name || 'Unknown'}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No workers assigned</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Materials</h3>
                            {project.materials && project.materials.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {project.materials.map((item, index) => (
                                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            <Package size={12} className="mr-1" />
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No materials listed</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
