import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { Phone, Mail, Hammer, ArrowLeft, ChevronLeft, ChevronRight, Briefcase, Clock, CheckCircle2, PoundSterling } from 'lucide-react';
import { DateTime } from 'luxon';
import {
    getAvailabilityColor,
    getCalendarTone,
    getWorkerStatusForDate,
    normalizeWorker
} from '../utils/workerStatus';

const availabilityDot = (status) => {
    switch (status) {
        case 'Available': return 'bg-emerald-400';
        case 'Busy':      return 'bg-amber-400';
        case 'On Leave':  return 'bg-red-400';
        default:          return 'bg-gray-400';
    }
};

const jobStatusBadge = (status) => {
    switch (status) {
        case 'Completed':   return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'Scheduled':   return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300';
        case 'Cancelled':   return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default:            return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
};

const WorkerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [worker, setWorker] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [calendarMonth, setCalendarMonth] = useState(DateTime.now().startOf('month'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workerRes, jobsRes] = await Promise.all([
                    axios.get(`/workers/${id}`),
                    axios.get('/jobs'),
                ]);
                setWorker(normalizeWorker(workerRes.data));
                const allJobs = jobsRes.data || [];
                setJobs(allJobs.filter(j =>
                    (j.assignedWorkers || []).some(w => (w._id || w)?.toString() === id)
                ));
            } catch {
                setError('Failed to fetch worker details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const getWorkerHours = () => {
        let total = 0;
        jobs.forEach(job => {
            (job.workCalendar || []).forEach(day => {
                (day.workerSchedules || []).forEach(ws => {
                    if (ws.workerId?.toString() === id && (ws.checkInTime || ws.checkOutTime))
                        total += ws.hours || 0;
                });
            });
        });
        return total;
    };

    const getAttendanceLogs = () => {
        const logs = [];
        jobs.forEach(job => {
            (job.workCalendar || []).forEach(day => {
                (day.workerSchedules || []).forEach(ws => {
                    if (ws.workerId?.toString() !== id) return;
                    if (!ws.checkInTime && !ws.checkOutTime && !ws.hours) return;
                    logs.push({
                        date: day.date,
                        jobTitle: job.title,
                        jobId: job._id,
                        checkIn: ws.checkInTime || null,
                        checkOut: ws.checkOutTime || null,
                        hours: ws.hours || 0,
                        earning: (ws.hours || 0) * (worker?.hourlyRate || 0),
                    });
                });
            });
        });
        logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        return logs;
    };

    const getTodayEarnings = () => {
        const todayKey = new Date().toISOString().slice(0, 10);
        let todayHours = 0;
        jobs.forEach(job => {
            (job.workCalendar || []).forEach(day => {
                if (!day.date?.startsWith(todayKey)) return;
                (day.workerSchedules || []).forEach(ws => {
                    if (ws.workerId?.toString() === id && (ws.checkInTime || ws.checkOutTime))
                        todayHours += ws.hours || 0;
                });
            });
        });
        return { hours: todayHours, earnings: todayHours * (worker?.hourlyRate || 0) };
    };

    const buildCalendarDays = () => {
        const monthStart = calendarMonth.startOf('month');
        const monthEnd   = calendarMonth.endOf('month');
        const gridStart  = monthStart.startOf('week');
        const gridEnd    = monthEnd.endOf('week');
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
            <div className="h-8 w-40 bg-white/40 rounded-xl"></div>
            <div className="glass-panel rounded-3xl p-8 h-48"></div>
            <div className="glass-panel rounded-3xl p-8 h-96"></div>
        </div>
    );
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!worker) return <div className="p-6 text-center text-gray-500">Worker not found</div>;

    const calendarDays = buildCalendarDays();
    const avail = worker.availability || 'Unknown';
    const totalJobs     = worker.jobs?.length || 0;
    const completedJobs = worker.jobs?.filter(j => j.status === 'Completed').length || 0;
    const activeJobs    = worker.jobs?.filter(j => j.status === 'In Progress').length || 0;

    return (
        <div className="space-y-8">
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Workers
            </button>

            {/* Profile header */}
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-black text-4xl shadow-inner">
                            {worker.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${availabilityDot(avail)}`}></span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Team Member</p>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{worker.name}</h1>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-4">£{worker.hourlyRate}/hr</p>

                        <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                            <a href={`mailto:${worker.email}`} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                <Mail size={14} /> {worker.email}
                            </a>
                            {worker.phone && (
                                <a href={`tel:${worker.phone}`} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors">
                                    <Phone size={14} /> {worker.phone}
                                </a>
                            )}
                            <span className={`flex items-center px-3 py-1.5 rounded-xl text-sm font-bold ${getAvailabilityColor(avail)}`}>
                                {avail}
                            </span>
                        </div>

                        {worker.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {worker.skills.map((skill, i) => (
                                    <span key={i} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">
                                        <Hammer size={11} /> {skill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex md:flex-col gap-3 flex-shrink-0">
                        {[
                            { label: 'Total Jobs',   value: totalJobs,     icon: Briefcase,    color: 'from-violet-500 to-purple-400' },
                            { label: 'Completed',    value: completedJobs, icon: CheckCircle2, color: 'from-emerald-500 to-teal-400' },
                            { label: 'In Progress',  value: activeJobs,    icon: Clock,        color: 'from-blue-500 to-cyan-400' },
                        ].map(s => {
                            const Icon = s.icon;
                            return (
                                <div key={s.label} className={`flex items-center gap-3 bg-gradient-to-br ${s.color} rounded-2xl px-4 py-3 shadow-sm`}>
                                    <Icon size={16} className="text-white" />
                                    <div>
                                        <p className="text-white/70 text-[10px] font-semibold uppercase">{s.label}</p>
                                        <p className="text-white text-xl font-black leading-none">{s.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Credentials */}
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 to-purple-400" />
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Credentials</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Username</p>
                            <p className="text-base font-bold text-gray-900 dark:text-white">{worker.username || worker.email?.split('@')?.[0] || 'Not assigned'}</p>
                        </div>
                        <div className="p-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Password</p>
                            <p className="text-base font-bold text-gray-900 dark:text-white">Securely stored</p>
                            <p className="text-xs text-gray-400 mt-0.5">Hidden for security</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Log */}
            {(() => {
                const logs = getAttendanceLogs();
                const fmt = (iso) => {
                    if (!iso) return '—';
                    const d = new Date(iso);
                    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                };
                const fmtDate = (str) => {
                    if (!str) return '—';
                    try { return DateTime.fromISO(str).toLocaleString(DateTime.DATE_MED); }
                    catch { return str; }
                };
                return (
                    <div className="glass-panel rounded-3xl overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-violet-400" />
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Clock size={18} className="text-blue-500" />
                                Attendance Log
                            </h2>
                            {logs.length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500">No attendance records yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-white/10">
                                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Project</th>
                                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Check In</th>
                                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Check Out</th>
                                                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Hours</th>
                                                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Earning</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                            {logs.map((log, i) => (
                                                <tr key={i} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmtDate(log.date)}</td>
                                                    <td className="py-3 px-3 text-gray-600 dark:text-gray-400 max-w-[180px] truncate">{log.jobTitle}</td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                                            {fmt(log.checkIn)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                                            {fmt(log.checkOut)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                        {log.checkIn || log.checkOut ? `${log.hours.toFixed(2)}h` : '—'}
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                                        {log.checkIn || log.checkOut ? `£${log.earning.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-gray-200 dark:border-white/10">
                                                <td colSpan={4} className="py-3 px-3 text-xs font-semibold text-gray-400 uppercase">Total</td>
                                                <td className="py-3 px-3 text-right font-black text-gray-800 dark:text-white whitespace-nowrap">
                                                    {logs.filter(l => l.checkIn || l.checkOut).reduce((s, l) => s + l.hours, 0).toFixed(2)}h
                                                </td>
                                                <td className="py-3 px-3 text-right font-black text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                                    £{logs.filter(l => l.checkIn || l.checkOut).reduce((s, l) => s + l.earning, 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Earnings Summary */}
            {(() => {
                const totalHrs = getWorkerHours();
                const totalEarnings = totalHrs * (worker.hourlyRate || 0);
                const today = getTodayEarnings();
                return (
                    <div className="glass-panel rounded-3xl overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <PoundSterling size={18} className="text-amber-500" />
                                Earnings Summary
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Hours</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                                        {totalHrs.toFixed(1)}<span className="text-sm font-bold text-gray-400 ml-1">hrs</span>
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Est. Earnings</p>
                                    <p className="text-2xl font-black text-amber-700 dark:text-amber-300">
                                        £{totalEarnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-2xl border ${today.hours > 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10'}`}>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Today's Earnings</p>
                                    {today.hours > 0 ? (
                                        <>
                                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                                                £{today.earnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{today.hours.toFixed(1)} hrs worked</p>
                                        </>
                                    ) : (
                                        <p className="text-xl font-bold text-gray-400 dark:text-gray-500">—</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Calendar */}
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-cyan-400" />
                <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Availability Calendar</h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Each date stores its own status. Undated days default to Available.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCalendarMonth(p => p.minus({ months: 1 }))} className="w-9 h-9 rounded-xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="min-w-[140px] text-center text-sm font-bold text-gray-800 dark:text-gray-100">{calendarMonth.toFormat('MMMM yyyy')}</span>
                            <button onClick={() => setCalendarMonth(p => p.plus({ months: 1 }))} className="w-9 h-9 rounded-xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                            <div key={d} className="text-center text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day) => (
                            <div
                                key={day.key}
                                className={`min-h-20 rounded-2xl border p-2.5 transition-colors ${getCalendarTone(day.status)} ${!day.inMonth ? 'opacity-40' : ''} ${day.isToday ? 'ring-2 ring-blue-400/60 ring-offset-1' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-bold ${day.isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>{day.label}</span>
                                    {day.isToday && <span className="text-[9px] font-bold text-blue-500 uppercase">Today</span>}
                                </div>
                                <div className="text-[10px] font-semibold">{day.status}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status History */}
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Status History</h2>
                    {worker.statusHistory?.length > 0 ? (
                        <div className="relative pl-5">
                            <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-emerald-300 via-teal-200 to-transparent dark:from-emerald-700 dark:via-teal-800"></div>
                            <div className="space-y-3">
                                {worker.statusHistory.map((entry) => (
                                    <div key={entry._id} className="relative">
                                        <div className="absolute -left-5 top-3 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-800"></div>
                                        <div className="flex items-start justify-between p-3.5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.status}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.note || 'No note'}</p>
                                            </div>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-4">{entry.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No status updates yet.</p>
                    )}
                </div>
            </div>

            {/* Project History */}
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 to-purple-400" />
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Project History</h2>
                    {worker.jobs?.length > 0 ? (
                        <div className="space-y-3">
                            {worker.jobs.map((job) => (
                                <div key={job._id} className="flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 font-black text-sm flex-shrink-0">
                                        {job.title?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white truncate">{job.title}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            {job.startDate ? DateTime.fromISO(job.startDate).toLocaleString(DateTime.DATE_MED) : '—'}
                                            {job.deadline ? ` → ${DateTime.fromISO(job.deadline).toLocaleString(DateTime.DATE_MED)}` : ''}
                                        </p>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${jobStatusBadge(job.status)}`}>{job.status}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm">No project history found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkerProfile;
