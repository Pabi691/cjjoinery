import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, DollarSign, Clock } from 'lucide-react';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';

const DashboardHome = () => {
    const [stats, setStats] = useState({
        activeProjects: 0,
        activeWorkers: 0,
        pendingQuotes: 0,
        totalRevenue: 0,
        recentProjects: [],
        monthlyRevenue: []
    });
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [{ data }, notificationsRes] = await Promise.all([
                    axios.get('/dashboard/summary'),
                    axios.get('/notifications')
                ]);
                setStats(data);
                setNotifications(notificationsRes?.data || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        { label: 'Active Projects', value: stats.activeProjects, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
        { label: 'Total Revenue', value: `£${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
        { label: 'Workers Active', value: stats.activeWorkers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
        { label: 'Pending Quotes', value: stats.pendingQuotes, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
    ];

    if (loading) return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-full ${stat.bg}`}>
                                    <Icon size={24} className={stat.color} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Revenue Overview</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.monthlyRevenue || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="revenue" fill="#78212e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Projects</h2>
                    <div className="space-y-4">
                        {stats.recentProjects.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No recent projects.</p>
                        ) : (
                            stats.recentProjects.map((project) => (
                                <div key={project._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                            {project.title.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{project.title}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {project.assignedWorkers?.length || 0} workers active
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${project.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Worker Notifications</h2>
                {notifications.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No notifications yet.</p>
                ) : (
                    <div className="space-y-3">
                        {notifications.slice(0, 6).map((notification) => (
                            <button
                                key={notification._id}
                                onClick={() => {
                                    setSelectedNotification(notification);
                                    setIsModalOpen(true);
                                }}
                                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {notification.workerName || 'Worker'}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Notification Details"
            >
                {selectedNotification ? (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Worker</div>
                            <div className="text-sm font-semibold">{selectedNotification.workerName}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Type</div>
                            <div className="text-sm">{selectedNotification.type}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Message</div>
                            <div className="text-sm">{selectedNotification.message}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Details</div>
                            <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-3 rounded">
                                {JSON.stringify(selectedNotification.details || {}, null, 2)}
                            </pre>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default DashboardHome;
