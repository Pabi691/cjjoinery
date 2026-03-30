import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { Phone, Mail, Hammer, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';
import {
    getAvailabilityColor,
    getCalendarTone,
    getWorkerStatusForDate,
    normalizeWorker
} from '../utils/workerStatus';

const WorkerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [worker, setWorker] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [calendarMonth, setCalendarMonth] = useState(DateTime.now().startOf('month'));

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const { data } = await axios.get(`/workers/${id}`);
                setWorker(normalizeWorker(data));
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch worker details');
                setLoading(false);
            }
        };
        fetchWorker();
    }, [id]);

    const buildCalendarDays = () => {
        const monthStart = calendarMonth.startOf('month');
        const monthEnd = calendarMonth.endOf('month');
        const gridStart = monthStart.startOf('week');
        const gridEnd = monthEnd.endOf('week');
        const days = [];

        let cursor = gridStart;
        while (cursor <= gridEnd) {
            const isoDate = cursor.toISODate();
            days.push({
                key: isoDate,
                label: cursor.day,
                isoDate,
                inMonth: cursor.month === calendarMonth.month,
                isToday: cursor.hasSame(DateTime.now(), 'day'),
                status: getWorkerStatusForDate(worker, isoDate)
            });
            cursor = cursor.plus({ days: 1 });
        }

        return days;
    };

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-4 w-24 bg-white/40 dark:bg-slate-800/40 rounded mb-8"></div>
            <div className="glass-panel p-8 rounded-3xl h-64 flex items-center space-x-8">
                <div className="h-32 w-32 rounded-full bg-gray-200/50 dark:bg-slate-700/50"></div>
                <div className="space-y-4 flex-1">
                    <div className="h-8 w-1/3 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                    <div className="h-4 w-1/4 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                </div>
            </div>
            <div className="glass-panel p-8 rounded-3xl h-96"></div>
        </div>
    );
    if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;
    if (!worker) return <div className="p-4 text-center">Worker not found</div>;

    const calendarDays = buildCalendarDays();

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium bg-white/40 dark:bg-slate-800/40 backdrop-blur-md px-4 py-2 rounded-xl w-max border border-white/40 dark:border-white/10 hover:shadow-sm"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Workers
            </button>

            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <div className="text-right">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hourly Rate</div>
                        <div className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Â£{worker.hourlyRate}</div>
                        <div className={`mt-3 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${getAvailabilityColor(worker.availability)}`}>
                            {worker.availability}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-4xl shadow-inner border-4 border-white/60 dark:border-gray-800">
                        {worker.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-center md:text-left pt-2">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">{worker.name}</h1>
                        <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-6 text-gray-600 dark:text-gray-400 font-medium">
                            <div className="flex items-center bg-white/40 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg border border-white/20">
                                <Mail size={16} className="mr-2 text-indigo-500" />
                                {worker.email}
                            </div>
                            <div className="flex items-center bg-white/40 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg border border-white/20">
                                <Phone size={16} className="mr-2 text-indigo-500" />
                                {worker.phone}
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
                            {worker.skills.map((skill, index) => (
                                <span key={index} className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-sm bg-white/60 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-white/40">
                                    <Hammer size={12} className="mr-2" />
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Credentials</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-white/10 rounded-2xl">
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                            {worker.username || worker.email?.split('@')?.[0] || 'Not assigned'}
                        </div>
                    </div>
                    <div className="p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-white/10 rounded-2xl">
                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">Securely stored</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Passwords are hidden by design for security.
                        </div>
                    </div>
                </div>

                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Availability Calendar</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Each date stores its own status. Dates without an update stay available.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCalendarMonth((prev) => prev.minus({ months: 1 }))}
                                className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="min-w-36 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                                {calendarMonth.toFormat('MMMM yyyy')}
                            </div>
                            <button
                                type="button"
                                onClick={() => setCalendarMonth((prev) => prev.plus({ months: 1 }))}
                                className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-white/10"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <div key={day} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day) => (
                            <div
                                key={day.key}
                                className={`min-h-24 rounded-2xl border p-3 transition-colors ${getCalendarTone(day.status)} ${!day.inMonth ? 'opacity-45' : ''} ${day.isToday ? 'ring-2 ring-indigo-400/60' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{day.label}</span>
                                    {day.isToday && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
                                    )}
                                </div>
                                <div className="mt-3 text-xs font-semibold">{day.status}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Status History</h2>
                {worker.statusHistory && worker.statusHistory.length > 0 ? (
                    <div className="space-y-3 mb-8">
                        {worker.statusHistory.map((entry) => (
                            <div key={entry._id} className="flex items-start justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                <div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{entry.status}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{entry.note || 'No note'}</div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{entry.date}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 mb-8">No status updates yet.</p>
                )}

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
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${job.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
