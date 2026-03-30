import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, DollarSign, Clock, MapPin } from 'lucide-react';
import { DateTime } from 'luxon';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import { normalizeWorker } from '../utils/workerStatus';

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
    const [jobs, setJobs] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [{ data }, notificationsRes, jobsRes, workersRes] = await Promise.all([
                    axios.get('/dashboard/summary'),
                    axios.get('/notifications'),
                    axios.get('/jobs'),
                    axios.get('/workers')
                ]);
                setStats(data);
                setNotifications(notificationsRes?.data || []);
                setJobs(jobsRes?.data || []);
                setWorkers((workersRes?.data || []).map(normalizeWorker));
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();

        const refreshInterval = window.setInterval(fetchDashboardData, 30000);
        window.addEventListener('focus', fetchDashboardData);

        return () => {
            window.clearInterval(refreshInterval);
            window.removeEventListener('focus', fetchDashboardData);
        };
    }, []);

    const formatDate = (value) => {
        if (!value) return 'Not set';
        const dt = DateTime.fromISO(value);
        return dt.isValid ? dt.toLocaleString(DateTime.DATE_MED) : value;
    };

    const recentDailyLogs = jobs
        .flatMap((job) => (job.dailyLogs || []).map((log) => ({
            ...log,
            jobTitle: job.title,
            jobId: job._id
        })))
        .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
        .slice(0, 6);

    const upcomingSchedules = jobs
        .flatMap((job) => (job.schedules || []).map((schedule) => ({
            ...schedule,
            jobTitle: job.title,
            jobId: job._id,
            assignedWorkers: job.assignedWorkers || []
        })))
        .flatMap((schedule) => (schedule.dates || []).map((date) => ({
            date,
            workerId: schedule.workerId?._id || schedule.workerId,
            jobTitle: schedule.jobTitle,
            jobId: schedule.jobId,
            assignedWorkers: schedule.assignedWorkers
        })))
        .filter((item) => item.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 6);

    const statCards = [
        { label: 'Active Projects', value: stats.activeProjects, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
        { label: 'Total Revenue', value: `£${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
        { label: 'Workers Active', value: stats.activeWorkers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
        { label: 'Pending Quotes', value: stats.pendingQuotes, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
    ];

    if (loading) return (
        <div className="space-y-6">
            <div className="h-8 w-64 bg-white/40 dark:bg-slate-800/40 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl shadow-sm h-32 animate-pulse">
                        <div className="h-4 w-24 bg-gray-200/50 dark:bg-slate-700/50 rounded mb-4"></div>
                        <div className="h-8 w-16 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl shadow-sm h-96 animate-pulse flex flex-col">
                    <div className="h-6 w-48 bg-gray-200/50 dark:bg-slate-700/50 rounded mb-6"></div>
                    <div className="flex-1 bg-gray-200/30 dark:bg-slate-700/30 rounded-lg"></div>
                </div>
                <div className="glass-panel p-6 rounded-2xl shadow-sm h-96 animate-pulse flex flex-col">
                    <div className="h-6 w-48 bg-gray-200/50 dark:bg-slate-700/50 rounded mb-6"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="h-16 w-full bg-gray-200/30 dark:bg-slate-700/30 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <p className="text-gray-500 font-medium mb-1 dark:text-gray-400">Manage and track your projects</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="glass-panel p-6 rounded-3xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                    <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1 tracking-tight">{stat.value}</p>
                                </div>
                                <div className={`p-4 rounded-2xl shadow-sm ${stat.bg}`}>
                                    <Icon size={28} className={stat.color} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Revenue Overview</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.monthlyRevenue || []} margin={{ top: 20 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" vertical={false} />
                                <XAxis dataKey="name" stroke="#6B7280" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.4)', radius: 8 }}
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '16px', color: '#111827', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#6366f1' }}
                                />
                                <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Projects</h2>
                    <div className="space-y-4">
                        {stats.recentProjects.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No recent projects.</p>
                        ) : (
                            stats.recentProjects.map((project) => (
                                <div key={project._id} className="flex items-center justify-between p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl transition-all hover:bg-white/80 hover:shadow-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-lg shadow-inner">
                                            {project.title.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{project.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                                {project.assignedWorkers?.length || 0} active workers
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${project.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        project.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Jobs List</h2>
                    {jobs.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No jobs found.</p>
                    ) : (
                        <div className="space-y-3">
                            {jobs.slice(0, 6).map((job) => (
                                <div key={job._id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/5 rounded-lg">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {job.customerId?.name || 'Unknown Customer'} · Deadline: {formatDate(job.deadline)}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {job.assignedWorkers?.length || 0} workers
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="glass-panel p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Worker Status</h2>
                    {workers.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No workers found.</p>
                    ) : (
                        <div className="space-y-3">
                            {workers.slice(0, 6).map((worker) => (
                                <div key={worker._id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/5 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                            {worker.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{worker.name || 'Worker'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{worker.email}</div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {worker.availability || worker.status || 'Unknown'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Daily Logs</h2>
                    {recentDailyLogs.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No daily logs yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentDailyLogs.map((log) => (
                                <div key={log._id} className="p-4 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/5 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {log.workerName || 'Worker'} · {log.jobTitle || 'Job'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(log.date || log.createdAt)}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">{log.description || 'No description'}</div>
                                    {log.location?.address && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                                            <MapPin size={12} className="mr-1" />
                                            {log.location.address}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="glass-panel p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Upcoming Schedules</h2>
                    {upcomingSchedules.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No schedules added.</p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingSchedules.map((item, idx) => {
                                const workerId = item.workerId?.toString?.() || item.workerId;
                                const worker = item.assignedWorkers?.find((w) => (w._id?.toString?.() || w._id) === workerId);
                                return (
                                    <div key={`${item.jobId}-${item.workerId}-${idx}`} className="p-4 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/5 rounded-lg">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {item.jobTitle || 'Job'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Worker: {worker?.name || 'Worker'} · Date: {formatDate(item.date)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl shadow-sm">
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
                                className="w-full text-left p-4 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
