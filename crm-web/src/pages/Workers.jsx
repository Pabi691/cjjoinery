import { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import WorkerForm from '../components/forms/WorkerForm';
import { UserPlus, Mail, Phone, Hammer, Clock, Trash2, ArrowRight, Users, CheckCircle2, AlertCircle, PoundSterling } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAvailabilityColor, normalizeWorker } from '../utils/workerStatus';

const availabilityDot = (status) => {
    switch (status) {
        case 'Available': return 'bg-emerald-400';
        case 'Busy':      return 'bg-amber-400';
        case 'On Leave':  return 'bg-red-400';
        default:          return 'bg-gray-400';
    }
};

const Workers = () => {
    const [workers, setWorkers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [workerToDelete, setWorkerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchWorkers = async () => {
        setLoading(true);
        try {
            const [wRes, jRes] = await Promise.all([
                axios.get('/workers'),
                axios.get('/jobs'),
            ]);
            setWorkers((wRes.data || []).map(normalizeWorker));
            setJobs(jRes.data || []);
        } catch {
            setError('Failed to fetch workers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWorkers(); }, []);

    const handleConfirmDelete = async () => {
        if (!workerToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/workers/${workerToDelete._id}`);
            setIsDeleteModalOpen(false);
            setWorkerToDelete(null);
            fetchWorkers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete worker');
        } finally {
            setIsDeleting(false);
        }
    };

    // Total hours from actual check-in/out only
    const getWorkerHours = (workerId) => {
        const id = workerId?.toString();
        let totalHours = 0;
        jobs.forEach(job => {
            (job.workCalendar || []).forEach(day => {
                (day.workerSchedules || []).forEach(ws => {
                    if (ws.workerId?.toString() === id && (ws.checkInTime || ws.checkOutTime))
                        totalHours += ws.hours || 0;
                });
            });
        });
        return totalHours;
    };

    const getTodayEarnings = (workerId, hourlyRate) => {
        const id = workerId?.toString();
        const todayKey = new Date().toISOString().slice(0, 10);
        let todayHours = 0;
        jobs.forEach(job => {
            (job.workCalendar || []).forEach(day => {
                if (!day.date?.startsWith(todayKey)) return;
                (day.workerSchedules || []).forEach(ws => {
                    if (ws.workerId?.toString() === id) todayHours += ws.hours || 0;
                });
            });
        });
        return { hours: todayHours, earnings: todayHours * (hourlyRate || 0) };
    };

    const getWorkerJobCount = (workerId) => {
        const id = workerId?.toString();
        return jobs.filter(j =>
            (j.assignedWorkers || []).some(w => (w._id || w)?.toString() === id)
        ).length;
    };

    const totalPayroll = workers.reduce((sum, w) => sum + (w.hourlyRate || 0) * getWorkerHours(w._id), 0);

    const stats = [
        { label: 'Total Workers', value: workers.length,                                             color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',          icon: Users },
        { label: 'Available',     value: workers.filter(w => w.availability === 'Available').length,  color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',  icon: CheckCircle2 },
        { label: 'Busy',          value: workers.filter(w => w.availability === 'Busy').length,       color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',              icon: Clock },
        { label: 'On Leave',      value: workers.filter(w => w.availability === 'On Leave').length,   color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',                 icon: AlertCircle },
    ];

    if (loading && workers.length === 0) return (
        <div className="space-y-8">
            <div className="h-10 w-56 bg-white/40 rounded-2xl animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse bg-white/40"></div>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-64 rounded-3xl animate-pulse bg-white/40"></div>)}
            </div>
        </div>
    );

    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Your team</p>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Worker <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400">Management</span>
                    </h1>
                </div>
                <button
                    onClick={() => { setEditingWorker(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 shadow-lg shadow-amber-200 dark:shadow-amber-900/30 transition-all hover:-translate-y-0.5 self-start"
                >
                    <UserPlus size={18} /> Add Worker
                </button>
            </div>

            {/* Payroll summary */}
            <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 w-fit">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                    <PoundSterling size={18} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-400">Est. Total Payroll (logged hours)</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">£{totalPayroll.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">{s.label}</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Worker Cards */}
            {workers.length === 0 ? (
                <div className="glass-panel rounded-3xl py-20 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No workers yet. Add your first team member.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((worker) => {
                        const avail = worker.availability || 'Unknown';
                        return (
                            <div key={worker._id} className="glass-panel rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col">
                                {/* Top gradient bar */}
                                <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-orange-400" />

                                <div className="p-6 flex flex-col flex-1">
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-black text-xl shadow-inner">
                                                {worker.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${availabilityDot(avail)}`}></span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">{worker.name}</h3>
                                            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">£{worker.hourlyRate}/hr</p>
                                        </div>
                                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${getAvailabilityColor(avail)}`}>{avail}</span>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2.5 flex-1">
                                        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                                <Mail size={13} className="text-blue-500" />
                                            </div>
                                            <span className="truncate">{worker.email}</span>
                                        </div>
                                        {worker.phone && (
                                            <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                                    <Phone size={13} className="text-emerald-500" />
                                                </div>
                                                <span>{worker.phone}</span>
                                            </div>
                                        )}
                                        {worker.currentJob && (
                                            <div className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400">
                                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                                    <Clock size={13} className="text-blue-500" />
                                                </div>
                                                <span className="truncate">{worker.currentJob.title}</span>
                                            </div>
                                        )}
                                        {worker.skills?.length > 0 && (
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Hammer size={13} className="text-violet-500" />
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {worker.skills.map((skill, i) => (
                                                        <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Earnings summary */}
                                    {(() => {
                                        const hrs = getWorkerHours(worker._id);
                                        const earnings = hrs * (worker.hourlyRate || 0);
                                        const jobCount = getWorkerJobCount(worker._id);
                                        const today = getTodayEarnings(worker._id, worker.hourlyRate);
                                        return (
                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-3 space-y-1 border border-amber-100 dark:border-amber-900/30 mt-3">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400">Hours logged</span>
                                                    <span className="font-bold text-gray-700 dark:text-gray-300">{hrs.toFixed(1)} hrs</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400">Est. earnings</span>
                                                    <span className="font-bold text-amber-700 dark:text-amber-300">£{earnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                {today.hours > 0 && (
                                                    <div className="flex justify-between text-xs border-t border-amber-200/60 dark:border-amber-900/40 pt-1 mt-0.5">
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                                            Today
                                                        </span>
                                                        <span className="font-bold text-emerald-700 dark:text-emerald-300">£{today.earnings.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400">Jobs assigned</span>
                                                    <span className="font-bold text-gray-700 dark:text-gray-300">{jobCount}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Footer */}
                                    <div className="mt-4 pt-4 border-t border-gray-100/70 dark:border-white/5 flex items-center justify-between">
                                        <button
                                            onClick={() => { setWorkerToDelete(worker); setIsDeleteModalOpen(true); }}
                                            className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => { setEditingWorker(worker); setIsModalOpen(true); }}
                                                className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => navigate(`/workers/${worker._id}`)}
                                                className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                                            >
                                                Profile <ArrowRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWorker ? 'Edit Worker' : 'Add New Worker'}>
                <WorkerForm worker={editingWorker} onSuccess={() => { setIsModalOpen(false); fetchWorkers(); }} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => !isDeleting && setIsDeleteModalOpen(false)} title="Delete Worker">
                <div className="text-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Delete <span className="text-red-500">{workerToDelete?.name}</span>?</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone.</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                        <button onClick={handleConfirmDelete} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">{isDeleting ? 'Deleting…' : 'Delete'}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Workers;
