import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { User, Phone, Mail, Hammer, Calendar, ArrowLeft } from 'lucide-react';
import { DateTime } from 'luxon';

const WorkerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [worker, setWorker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const { data } = await axios.get(`/workers/${id}`);
                setWorker(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch worker details');
                setLoading(false);
            }
        };
        fetchWorker();
    }, [id]);

    if (loading) return <div className="p-4 text-center text-gray-600 dark:text-gray-400">Loading profile...</div>;
    if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;
    if (!worker) return <div className="p-4 text-center">Worker not found</div>;

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Workers
            </button>

            {/* Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                    <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-3xl">
                        {worker.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{worker.name}</h1>
                        <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4 mt-2 text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                                <Mail size={16} className="mr-2" />
                                {worker.email}
                            </div>
                            <div className="flex items-center">
                                <Phone size={16} className="mr-2" />
                                {worker.phone}
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                            {worker.skills.map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    <Hammer size={12} className="mr-1" />
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Hourly Rate</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">£{worker.hourlyRate}</div>
                        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${worker.availability === 'Available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                            {worker.availability}
                        </div>
                    </div>
                </div>
            </div>

            {/* Project History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Project History</h2>
                {worker.jobs && worker.jobs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deadline</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {worker.jobs.map((job) => (
                                    <tr key={job._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{job.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${job.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {job.startDate ? DateTime.fromISO(job.startDate).toLocaleString(DateTime.DATE_MED) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {job.deadline ? DateTime.fromISO(job.deadline).toLocaleString(DateTime.DATE_MED) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No project history found for this worker.</p>
                )}
            </div>
        </div>
    );
};

export default WorkerProfile;
