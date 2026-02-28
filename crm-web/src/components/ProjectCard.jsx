import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { DateTime } from 'luxon';

const ProjectCard = ({ project, onEdit }) => {
    const navigate = useNavigate();

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

    const formatDate = (date) => {
        return DateTime.fromISO(date).toLocaleString(DateTime.DATE_MED);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{project.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                </span>
            </div>

            <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users size={16} className="mr-2" />
                    <span>{project.assignedWorkers?.length || 0} Workers Assigned</span>
                </div>

                {project.deadline && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock size={16} className="mr-2" />
                        <span>Deadline: {formatDate(project.deadline)}</span>
                    </div>
                )}

                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle size={16} className="mr-2" />
                    <span>Customer: {project.customerId?.name || 'Unknown'}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="flex -space-x-2">
                    {project.assignedWorkers?.map((worker, index) => (
                        <div key={worker._id || index} className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400" title={worker?.name || 'Unknown'}>
                            {worker?.name?.charAt(0) || '?'}
                        </div>
                    ))}
                    {project.assignedWorkers?.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                            +{project.assignedWorkers.length - 3}
                        </div>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(project)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => navigate(`/projects/${project._id}`)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
