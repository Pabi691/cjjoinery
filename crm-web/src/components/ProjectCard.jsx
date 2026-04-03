import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CheckCircle, Clock, Trash2, ArrowRight } from 'lucide-react';
import { DateTime } from 'luxon';

const statusConfig = (status) => {
    switch (status) {
        case 'Completed':   return { bar: 'from-emerald-400 to-teal-400',    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-400' };
        case 'In Progress': return { bar: 'from-blue-400 to-cyan-400',       badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',         dot: 'bg-blue-400' };
        case 'Scheduled':   return { bar: 'from-violet-400 to-purple-400',   badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300', dot: 'bg-violet-400' };
        case 'Cancelled':   return { bar: 'from-red-400 to-rose-400',        badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',             dot: 'bg-red-400' };
        default:            return { bar: 'from-gray-300 to-gray-400',       badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',            dot: 'bg-gray-400' };
    }
};

const ProjectCard = ({ project, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const { bar, badge, dot } = statusConfig(project.status);

    const formatDate = (date) => {
        if (!date) return null;
        return DateTime.fromISO(date).toLocaleString(DateTime.DATE_MED);
    };

    return (
        <div className="glass-panel rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col">
            {/* Gradient status bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${bar}`} />

            <div className="p-6 flex flex-col flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${dot} shadow-sm`}></div>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge}`}>{project.status}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{project.title}</h3>
                        {project.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                        )}
                    </div>
                    {/* Customer avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 font-black text-sm flex-shrink-0">
                        {project.customerId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                </div>

                {/* Info rows */}
                <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                            <Users size={14} className="text-violet-500" />
                        </div>
                        <span>{project.assignedWorkers?.length || 0} worker{project.assignedWorkers?.length !== 1 ? 's' : ''} assigned</span>
                    </div>

                    {project.customerId?.name && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle size={14} className="text-emerald-500" />
                            </div>
                            <span className="truncate">{project.customerId.name}</span>
                        </div>
                    )}

                    {project.deadline && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                                <Clock size={14} className="text-amber-500" />
                            </div>
                            <span>Deadline: {formatDate(project.deadline)}</span>
                        </div>
                    )}

                    {project.startDate && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                <Calendar size={14} className="text-blue-500" />
                            </div>
                            <span>Start: {formatDate(project.startDate)}</span>
                        </div>
                    )}
                </div>

                {/* Worker avatars */}
                {project.assignedWorkers?.length > 0 && (
                    <div className="mt-4 flex -space-x-2">
                        {project.assignedWorkers.slice(0, 4).map((worker, index) => (
                            <div
                                key={worker._id || index}
                                title={worker?.name || 'Worker'}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300"
                            >
                                {worker?.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        ))}
                        {project.assignedWorkers.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                +{project.assignedWorkers.length - 4}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer actions */}
                <div className="mt-5 pt-4 border-t border-gray-100/70 dark:border-white/5 flex items-center justify-between">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    >
                        <Trash2 size={13} /> Delete
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onEdit(project)}
                            className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => navigate(`/projects/${project._id}`)}
                            className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 transition-colors"
                        >
                            View <ArrowRight size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
