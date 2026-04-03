import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Briefcase, Users, DollarSign, Clock, MapPin, ArrowUpRight, CalendarDays, Activity, FileText, CheckCircle2, Circle, Zap } from 'lucide-react';
import { DateTime } from 'luxon';
import axios from '../utils/axiosConfig';
import { normalizeWorker } from '../utils/workerStatus';

const availabilityStyle = (status) => {
    switch (status) {
        case 'Available':  return { dot: 'bg-emerald-400', ring: 'ring-emerald-400/30', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
        case 'Busy':       return { dot: 'bg-amber-400',   ring: 'ring-amber-400/30',   badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
        case 'On Leave':   return { dot: 'bg-red-400',     ring: 'ring-red-400/30',     badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
        default:           return { dot: 'bg-gray-400',    ring: 'ring-gray-400/30',    badge: 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };
    }
};

const jobStatusStyle = (status) => {
    switch (status) {
        case 'Completed':   return { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' };
        case 'In Progress': return { bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
        case 'Scheduled':   return { bar: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' };
        case 'Cancelled':   return { bar: 'bg-red-400',     badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
        default:            return { bar: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
};

const SectionHeader = ({ icon: Icon, title, accent }) => (
    <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${accent}`}>
            <Icon size={18} className="text-white" />
        </div>
        <h2 className="text-base font-bold text-gray-800 dark:text-white tracking-tight">{title}</h2>
    </div>
);

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
    const [jobs, setJobs] = useState([]);
    const [workers, setWorkers] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [{ data }, jobsRes, workersRes] = await Promise.all([
                    axios.get('/dashboard/summary'),
                    axios.get('/jobs'),
                    axios.get('/workers')
                ]);
                setStats(data);
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
        .flatMap((job) => (job.dailyLogs || []).map((log) => ({ ...log, jobTitle: job.title, jobId: job._id })))
        .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
        .slice(0, 5);

    const upcomingSchedules = jobs
        .flatMap((job) => (job.schedules || []).map((schedule) => ({
            ...schedule, jobTitle: job.title, jobId: job._id, assignedWorkers: job.assignedWorkers || []
        })))
        .flatMap((schedule) => (schedule.dates || []).map((date) => ({
            date, workerId: schedule.workerId?._id || schedule.workerId,
            jobTitle: schedule.jobTitle, jobId: schedule.jobId, assignedWorkers: schedule.assignedWorkers
        })))
        .filter((item) => item.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    const statCards = [
        {
            label: 'Active Projects', value: stats.activeProjects, icon: Briefcase,
            gradient: 'from-blue-500 to-cyan-400',
            glow: 'shadow-blue-200 dark:shadow-blue-900/40',
            bg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
            iconBg: 'bg-white/20',
        },
        {
            label: 'Total Revenue', value: `£${stats.totalRevenue.toLocaleString()}`, icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-400',
            glow: 'shadow-emerald-200 dark:shadow-emerald-900/40',
            bg: 'bg-gradient-to-br from-emerald-500 to-teal-400',
            iconBg: 'bg-white/20',
        },
        {
            label: 'Workers Active', value: stats.activeWorkers, icon: Users,
            gradient: 'from-violet-500 to-purple-400',
            glow: 'shadow-violet-200 dark:shadow-violet-900/40',
            bg: 'bg-gradient-to-br from-violet-500 to-purple-400',
            iconBg: 'bg-white/20',
        },
        {
            label: 'Pending Quotes', value: stats.pendingQuotes, icon: Clock,
            gradient: 'from-amber-500 to-orange-400',
            glow: 'shadow-amber-200 dark:shadow-amber-900/40',
            bg: 'bg-gradient-to-br from-amber-500 to-orange-400',
            iconBg: 'bg-white/20',
        },
    ];

    if (loading) return (
        <div className="space-y-6 p-1">
            <div className="h-8 w-64 bg-white/40 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-3xl animate-pulse bg-white/40"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1,2].map(i => <div key={i} className="h-80 rounded-3xl animate-pulse bg-white/40"></div>)}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Welcome back</p>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">Overview</span></h1>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl px-4 py-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Live · Updated just now</span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={`relative overflow-hidden ${stat.bg} rounded-3xl p-6 shadow-xl ${stat.glow} shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default`}>
                            {/* Decorative ghost icon */}
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <Icon size={100} className="text-white" />
                            </div>
                            {/* Decorative orb */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>

                            <div className={`w-11 h-11 rounded-2xl ${stat.iconBg} backdrop-blur-sm flex items-center justify-center mb-4 shadow-inner`}>
                                <Icon size={22} className="text-white" />
                            </div>
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-white text-3xl font-black tracking-tight">{stat.value}</p>

                            <div className="mt-3 flex items-center gap-1 text-white/60 text-xs font-medium">
                                <ArrowUpRight size={13} />
                                <span>This month</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Revenue Chart + Recent Projects */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Chart — wider */}
                <div className="lg:col-span-3 glass-panel rounded-3xl p-6 shadow-sm">
                    <SectionHeader icon={Activity} title="Revenue Overview" accent="bg-gradient-to-br from-blue-500 to-cyan-400" />
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyRevenue || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="areaRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" vertical={false} />
                                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', fontWeight: 700, color: '#111827' }}
                                    itemStyle={{ color: '#6366f1' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#areaRevenue)" dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Projects — narrower */}
                <div className="lg:col-span-2 glass-panel rounded-3xl p-6 shadow-sm">
                    <SectionHeader icon={Briefcase} title="Recent Projects" accent="bg-gradient-to-br from-violet-500 to-purple-400" />
                    <div className="space-y-3">
                        {stats.recentProjects.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">No recent projects.</p>
                        ) : (
                            stats.recentProjects.map((project) => {
                                const { bar, badge } = jobStatusStyle(project.status);
                                return (
                                    <div key={project._id} className="relative flex items-center gap-3 p-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 transition-all hover:shadow-sm group">
                                        {/* Accent bar */}
                                        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${bar}`}></div>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-extrabold text-sm flex-shrink-0 ml-2">
                                            {project.title.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{project.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{project.assignedWorkers?.length || 0} workers</p>
                                        </div>
                                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${badge}`}>{project.status}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Jobs + Workers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Jobs */}
                <div className="glass-panel rounded-3xl p-6 shadow-sm">
                    <SectionHeader icon={FileText} title="Jobs List" accent="bg-gradient-to-br from-amber-500 to-orange-400" />
                    {jobs.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No jobs found.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {jobs.slice(0, 6).map((job, i) => {
                                const { bar, badge } = jobStatusStyle(job.status);
                                return (
                                    <div key={job._id} className="relative flex items-center gap-3 p-3.5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 transition-all">
                                        <div className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full ${bar}`}></div>
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-amber-700 dark:text-amber-400 font-black text-sm flex-shrink-0 ml-2">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{job.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.customerId?.name || 'Unknown'} · {formatDate(job.deadline)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{job.status}</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{job.assignedWorkers?.length || 0}w</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Workers */}
                <div className="glass-panel rounded-3xl p-6 shadow-sm">
                    <SectionHeader icon={Users} title="Worker Status" accent="bg-gradient-to-br from-violet-500 to-purple-400" />
                    {workers.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No workers found.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {workers.slice(0, 6).map((worker) => {
                                const avail = worker.availability || worker.status || 'Unknown';
                                const style = availabilityStyle(avail);
                                return (
                                    <div key={worker._id} className="flex items-center gap-3 p-3.5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 transition-all">
                                        <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 font-black text-sm ring-2 ${style.ring}`}>
                                            {worker.name?.charAt(0)?.toUpperCase() || '?'}
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${style.dot}`}></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{worker.name || 'Worker'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{worker.email}</p>
                                        </div>
                                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${style.badge}`}>{avail}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Logs + Upcoming Schedules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Logs — Timeline style */}
                <div className="glass-panel rounded-3xl p-6 shadow-sm">
                    <SectionHeader icon={CheckCircle2} title="Recent Daily Logs" accent="bg-gradient-to-br from-emerald-500 to-teal-400" />
                    {recentDailyLogs.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No daily logs yet.</p>
                    ) : (
                        <div className="relative pl-5">
                            {/* Vertical line */}
                            <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-emerald-300 via-teal-200 to-transparent dark:from-emerald-700 dark:via-teal-800"></div>

                            <div className="space-y-4">
                                {recentDailyLogs.map((log, i) => (
                                    <div key={log._id} className="relative">
                                        {/* Timeline dot */}
                                        <div className="absolute -left-5 top-2 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-800 shadow-sm shadow-emerald-200"></div>

                                        <div className="p-3.5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {log.workerName || 'Worker'}
                                                    <span className="font-normal text-gray-400 dark:text-gray-500"> · </span>
                                                    <span className="text-indigo-600 dark:text-indigo-400">{log.jobTitle}</span>
                                                </p>
                                                <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">{formatDate(log.date || log.createdAt)}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300">{log.description || 'No description'}</p>
                                            {log.location?.address && (
                                                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                                                    <MapPin size={11} /> {log.location.address}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Upcoming Schedules */}
                <div className="glass-panel rounded-3xl p-6 shadow-sm">
                    <SectionHeader icon={CalendarDays} title="Upcoming Schedules" accent="bg-gradient-to-br from-rose-500 to-pink-400" />
                    {upcomingSchedules.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No schedules added.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {upcomingSchedules.map((item, idx) => {
                                const workerId = item.workerId?.toString?.() || item.workerId;
                                const worker = item.assignedWorkers?.find(w => (w._id?.toString?.() || w._id) === workerId);
                                const dt = DateTime.fromISO(item.date);
                                return (
                                    <div key={`${item.jobId}-${item.workerId}-${idx}`} className="flex items-center gap-3 p-3.5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 transition-all">
                                        {/* Date block */}
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-400 flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                                            <span className="text-white text-[10px] font-bold uppercase leading-none">{dt.isValid ? dt.toFormat('MMM') : '—'}</span>
                                            <span className="text-white text-lg font-black leading-tight">{dt.isValid ? dt.toFormat('d') : '—'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.jobTitle || 'Job'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <Zap size={11} className="text-rose-400" />
                                                {worker?.name || 'Worker'}
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            {dt.isValid ? dt.toFormat('EEE') : ''}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
