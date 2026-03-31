import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import {
    ArrowLeft,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Package,
    Save,
    User,
    Users
} from 'lucide-react';
import { DateTime } from 'luxon';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const normalizeDateKey = (value) => {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parsed = typeof value === 'string'
        ? DateTime.fromISO(value)
        : DateTime.fromJSDate(new Date(value));

    return parsed.isValid ? parsed.toFormat('yyyy-MM-dd') : '';
};

const resolveWorkerId = (value) => (
    value?._id?.toString?.() || value?.toString?.() || ''
);

const getTotalPlannedHours = (workCalendar = []) => (
    workCalendar.reduce((total, entry) => total + (Number(entry?.hours) || 0), 0)
);

const buildWorkCalendarFromSchedules = (schedules = []) => {
    const derived = [];

    for (const schedule of schedules) {
        const workerId = resolveWorkerId(schedule?.workerId);
        for (const date of schedule?.dates || []) {
            derived.push({
                date,
                hours: 0,
                workerIds: workerId ? [workerId] : []
            });
        }
    }

    return derived;
};

const normalizeWorkCalendar = (entries = []) => {
    const byDate = new Map();

    for (const rawEntry of entries) {
        const date = normalizeDateKey(rawEntry?.date);
        if (!date) continue;

        const hours = Number(rawEntry?.hours);
        const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 0;
        const workerIds = Array.from(
            new Set((rawEntry?.workerIds || []).map(resolveWorkerId).filter(Boolean))
        );

        const existing = byDate.get(date) || { date, hours: 0, workerIds: [] };
        byDate.set(date, {
            date,
            hours: safeHours,
            workerIds: Array.from(new Set([...(existing.workerIds || []), ...workerIds]))
        });
    }

    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const buildCalendarDays = (month) => {
    const monthStart = month.startOf('month');
    const monthEnd = month.endOf('month');
    const gridStart = monthStart.startOf('week');
    const gridEnd = monthEnd.endOf('week');
    const days = [];

    let cursor = gridStart;
    while (cursor <= gridEnd) {
        days.push(cursor);
        cursor = cursor.plus({ days: 1 });
    }

    return days;
};

const isDateWithinRange = (date, startDate, deadline) => {
    const dateKey = normalizeDateKey(date);
    const startKey = normalizeDateKey(startDate);
    const deadlineKey = normalizeDateKey(deadline);

    if (!dateKey || !startKey || !deadlineKey) return false;
    return dateKey >= startKey && dateKey <= deadlineKey;
};

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [calendarMonth, setCalendarMonth] = useState(DateTime.now().startOf('month'));
    const [selectedDate, setSelectedDate] = useState(normalizeDateKey(DateTime.now().toISO()));
    const [selectedWorkerId, setSelectedWorkerId] = useState('');
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const apiHost = apiBase.replace(/\/api\/?$/, '');

    const resolveImageUrl = (imageUrl) => {
        if (!imageUrl || imageUrl === 'No image') return '';
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
        if (imageUrl.startsWith('/')) return `${apiHost}${imageUrl}`;
        return `${apiHost}/uploads/${imageUrl}`;
    };

    const toNumber = (value) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    };

    const mapCenter = (lat, lng) => [lat, lng];

    const normalizeProject = (payload) => {
        if (!payload || typeof payload !== 'object') return payload;

        const doc = payload._doc && typeof payload._doc === 'object'
            ? { ...payload, ...payload._doc }
            : payload;

        const workCalendar = normalizeWorkCalendar(
            doc.workCalendar?.length ? doc.workCalendar : buildWorkCalendarFromSchedules(doc.schedules || [])
        );

        const dailyLogs = [...(doc.dailyLogs || [])].sort((a, b) => {
            const left = normalizeDateKey(a?.date) || '';
            const right = normalizeDateKey(b?.date) || '';
            return right.localeCompare(left);
        });

        return {
            ...doc,
            deadline: doc.deadline || payload.deadline || doc.dueDate || doc.endDate || null,
            assignedWorkers: doc.assignedWorkers || [],
            materials: doc.materials || [],
            workCalendar,
            dailyLogs,
            expectedHours: doc.expectedHours ?? getTotalPlannedHours(workCalendar)
        };
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data } = await axios.get(`/jobs/${id}`);
                const normalized = normalizeProject(data);
                const defaultDate = normalized.workCalendar?.[0]?.date
                    || normalizeDateKey(normalized.dailyLogs?.[0]?.date)
                    || normalizeDateKey(normalized.startDate)
                    || normalizeDateKey(DateTime.now().toISO());

                setProject(normalized);
                setSelectedDate(defaultDate);
                setCalendarMonth(DateTime.fromISO(defaultDate).isValid
                    ? DateTime.fromISO(defaultDate).startOf('month')
                    : DateTime.now().startOf('month'));
                setLoading(false);
            } catch (_) {
                setError('Failed to fetch project details');
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'Scheduled':
                return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300';
            case 'Pending':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'Cancelled':
                return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const updateProjectField = (field, value) => {
        setProject((prev) => {
            const nextValue = value || null;
            const nextProject = {
                ...prev,
                [field]: nextValue
            };

            if (
                field === 'startDate' &&
                nextProject.deadline &&
                normalizeDateKey(nextProject.deadline) < normalizeDateKey(nextValue)
            ) {
                nextProject.deadline = nextValue;
            }

            return nextProject;
        });
        setSelectedDate((prevSelectedDate) => {
            const nextStartDate = field === 'startDate' ? value : project?.startDate;
            const nextDeadline = field === 'deadline' ? value : (field === 'startDate' && project?.deadline && normalizeDateKey(project.deadline) < normalizeDateKey(value) ? value : project?.deadline);
            const startKey = normalizeDateKey(nextStartDate);
            const deadlineKey = normalizeDateKey(nextDeadline);

            if (!startKey || !deadlineKey) {
                return prevSelectedDate;
            }

            if (prevSelectedDate < startKey) return startKey;
            if (prevSelectedDate > deadlineKey) return deadlineKey;
            return prevSelectedDate;
        });
        setSaveMessage('');
    };

    const updateSelectedDateEntry = (updater) => {
        const existingEntry = project.workCalendar?.find((entry) => entry.date === selectedDate) || {
            date: selectedDate,
            hours: 0,
            workerIds: []
        };

        const nextRawEntry = updater({
            ...existingEntry,
            workerIds: [...(existingEntry.workerIds || [])]
        });

        const normalizedEntry = normalizeWorkCalendar([{
            ...nextRawEntry,
            date: selectedDate
        }])[0] || {
            date: selectedDate,
            hours: 0,
            workerIds: []
        };

        const nextCalendar = [
            ...(project.workCalendar || []).filter((entry) => entry.date !== selectedDate),
            ...(normalizedEntry.hours > 0 || normalizedEntry.workerIds.length > 0
                ? [normalizedEntry]
                : [])
        ];

        const normalizedCalendar = normalizeWorkCalendar(nextCalendar);
        const newTotal = getTotalPlannedHours(normalizedCalendar);
        const currentTotal = getTotalPlannedHours(project.workCalendar || []);

        if (project.expectedHours && newTotal > project.expectedHours && newTotal > currentTotal) {
            setSaveMessage(`Error: Planned Hours (${newTotal}h) cannot exceed Expected Time (${project.expectedHours}h).`);
            return;
        }

        setProject({
            ...project,
            workCalendar: normalizedCalendar
        });
        setSaveMessage('');
    };

    const toggleWorkerOnSelectedDate = (workerId) => {
        updateSelectedDateEntry((entry) => {
            const alreadyAssigned = entry.workerIds.includes(workerId);
            return {
                ...entry,
                workerIds: alreadyAssigned
                    ? entry.workerIds.filter((item) => item !== workerId)
                    : [...entry.workerIds, workerId]
            };
        });
    };

    const savePlanner = async () => {
        if (!project) return;

        setSaving(true);
        setSaveMessage('');
        try {
            const payload = {
                startDate: project.startDate ? normalizeDateKey(project.startDate) : null,
                deadline: project.deadline ? normalizeDateKey(project.deadline) : null,
                workCalendar: normalizeWorkCalendar(project.workCalendar || [])
            };

            const { data } = await axios.put(`/jobs/${id}`, payload);
            setProject(normalizeProject(data));
            setSaveMessage('Planner saved successfully.');
        } catch (_) {
            setSaveMessage('Failed to save planner.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-32 bg-white/40 dark:bg-slate-800/40 rounded-lg mb-8"></div>
            <div className="glass-panel p-8 rounded-3xl h-64"></div>
            <div className="glass-panel p-8 rounded-3xl h-[36rem]"></div>
        </div>
    );

    if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;
    if (!project) return <div className="p-4 text-center">Project not found</div>;

    const totalPlannedHours = getTotalPlannedHours(project.workCalendar || []);
    const planningStart = normalizeDateKey(project.startDate);
    const planningDeadline = normalizeDateKey(project.deadline);
    const isSelectedDateEditable = isDateWithinRange(selectedDate, project.startDate, project.deadline);
    const selectedEntry = project.workCalendar?.find((entry) => entry.date === selectedDate) || {
        date: selectedDate,
        hours: 0,
        workerIds: []
    };
    const selectedWorkers = project.assignedWorkers.filter((worker) => (
        selectedEntry.workerIds.includes(resolveWorkerId(worker))
    ));
    const logsForSelectedDate = (project.dailyLogs || []).filter((log) => (
        normalizeDateKey(log.date) === selectedDate
    ));
    const workerFilterOptions = Array.from(new Map(
        [
            ...selectedWorkers.map((worker) => [resolveWorkerId(worker), worker?.name || 'Worker']),
            ...logsForSelectedDate.map((log) => [
                resolveWorkerId(log.workerId) || log.workerName,
                log.workerName || 'Worker'
            ])
        ].filter(([key]) => key)
    ).entries()).map(([value, label]) => ({ value, label }));
    const visibleLogs = selectedWorkerId
        ? logsForSelectedDate.filter((log) => (
            (resolveWorkerId(log.workerId) || log.workerName) === selectedWorkerId
        ))
        : logsForSelectedDate;
    const calendarDays = buildCalendarDays(calendarMonth);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-medium bg-white/40 dark:bg-slate-800/40 backdrop-blur-md px-4 py-2 rounded-xl w-max border border-white/40 dark:border-white/10 hover:shadow-sm"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Projects
            </button>

            <div className="glass-panel rounded-3xl shadow-lg overflow-hidden">
                <div className="p-8 border-b border-gray-100/50 dark:border-gray-700/50 flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{project.title}</h1>
                        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 font-medium">{project.description}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm whitespace-nowrap border border-white/20 ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>

                <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-white/10 rounded-[28px] p-6 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Project Planner</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Replace the old schedule list with date-by-date planning for hours and assigned workers.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <label className="block">
                                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                        Start Date
                                    </span>
                                    <input
                                        type="date"
                                        value={project.startDate ? normalizeDateKey(project.startDate) : ''}
                                        onChange={(e) => updateProjectField('startDate', e.target.value)}
                                        max={project.deadline ? normalizeDateKey(project.deadline) : undefined}
                                        className="w-full rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100"
                                    />
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                        Deadline
                                    </span>
                                    <input
                                        type="date"
                                        value={project.deadline ? normalizeDateKey(project.deadline) : ''}
                                        onChange={(e) => updateProjectField('deadline', e.target.value)}
                                        min={project.startDate ? normalizeDateKey(project.startDate) : undefined}
                                        className="w-full rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100"
                                    />
                                </label>
                                <div className="rounded-2xl border border-white/50 dark:border-white/10 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900/50 px-4 py-3">
                                    <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Total Planned Hours
                                    </div>
                                    <div className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
                                        {totalPlannedHours}h
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Auto-calculated from the calendar
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[24px] border border-white/50 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/30 p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Planning Calendar</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Select a date to assign hours and workers</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCalendarMonth((prev) => prev.minus({ months: 1 }))}
                                            className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/50 dark:border-white/10"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <div className="min-w-36 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                                            {calendarMonth.toFormat('MMMM yyyy')}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setCalendarMonth((prev) => prev.plus({ months: 1 }))}
                                            className="p-2 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-white/50 dark:border-white/10"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                                        Start Date
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                                        Deadline
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                        Editable Range
                                    </span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                        Planned Day
                                    </span>
                                </div>

                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                        <div key={day} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {calendarDays.map((day) => {
                                        const isoDate = day.toFormat('yyyy-MM-dd');
                                        const entry = project.workCalendar?.find((item) => item.date === isoDate);
                                        const isSelected = selectedDate === isoDate;
                                        const isToday = day.hasSame(DateTime.now(), 'day');
                                        const inMonth = day.month === calendarMonth.month;
                                        const isStartDate = planningStart === isoDate;
                                        const isDeadline = planningDeadline === isoDate;
                                        const isInRange = isDateWithinRange(isoDate, project.startDate, project.deadline);
                                        const hasPlanning = (entry?.hours || 0) > 0 || (entry?.workerIds?.length || 0) > 0;
                                        const canSelect = inMonth && isInRange;

                                        let tone = 'border-white/50 dark:border-white/10 bg-slate-100/70 dark:bg-slate-900/20';
                                        if (isInRange) {
                                            tone = 'border-amber-200 dark:border-amber-700/30 bg-amber-50/70 dark:bg-amber-900/10';
                                        }
                                        if (hasPlanning) {
                                            tone = 'border-blue-200 dark:border-blue-700/30 bg-blue-50/80 dark:bg-blue-900/15';
                                        }
                                        if (isStartDate) {
                                            tone = 'border-emerald-200 dark:border-emerald-700/30 bg-emerald-50/80 dark:bg-emerald-900/15';
                                        }
                                        if (isDeadline) {
                                            tone = 'border-rose-200 dark:border-rose-700/30 bg-rose-50/80 dark:bg-rose-900/15';
                                        }

                                        return (
                                            <button
                                                key={isoDate}
                                                type="button"
                                                onClick={canSelect
                                                    ? () => {
                                                        setSelectedDate(isoDate);
                                                        setSelectedWorkerId('');
                                                    }
                                                    : undefined}
                                                className={`min-h-28 rounded-2xl border p-3 text-left transition-all ${
                                                    isSelected
                                                        ? 'border-gray-900 dark:border-white ring-2 ring-gray-900/10 dark:ring-white/20 bg-white dark:bg-slate-800/80'
                                                        : `${tone} ${canSelect ? 'hover:bg-white dark:hover:bg-slate-800/60' : 'cursor-not-allowed'}`
                                                } ${!inMonth ? 'opacity-40' : ''} ${!isInRange ? 'opacity-45' : ''}`}
                                                disabled={!canSelect}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-bold ${canSelect ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        {day.day}
                                                    </span>
                                                    {isStartDate ? (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                                                            Start
                                                        </span>
                                                    ) : isDeadline ? (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                                                            End
                                                        </span>
                                                    ) : isToday ? (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                                                            Today
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="mt-5 space-y-1">
                                                    <div className={`text-xs font-semibold ${canSelect ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        {!isInRange ? 'Locked' : entry?.hours ? `${entry.hours}h planned` : 'No hours'}
                                                    </div>
                                                    <div className={`text-[11px] ${canSelect ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        {!isInRange
                                                            ? 'Outside project range'
                                                            : entry?.workerIds?.length
                                                                ? `${entry.workerIds.length} workers assigned`
                                                                : 'No workers assigned'}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
                                <div className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {DateTime.fromISO(selectedDate).toLocaleString(DateTime.DATE_HUGE)}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Plan the team and hours for this day
                                            </div>
                                        </div>
                                        <Calendar size={18} className="text-indigo-500" />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                                Planned Hours
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={selectedEntry.hours || ''}
                                                disabled={!isSelectedDateEditable}
                                                onChange={(e) => updateSelectedDateEntry((entry) => ({
                                                    ...entry,
                                                    hours: e.target.value
                                                }))}
                                                placeholder="0"
                                                className="w-full rounded-2xl border border-white/50 dark:border-white/10 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </label>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateProjectField('startDate', selectedDate)}
                                                disabled={!isSelectedDateEditable}
                                                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Use as Start Date
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateProjectField('deadline', selectedDate)}
                                                disabled={!isSelectedDateEditable}
                                                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Use as Deadline
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">Workers for {DateTime.fromISO(selectedDate).toFormat('dd MMM')}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Only assigned team members can be planned here</div>
                                        </div>
                                        <Users size={18} className="text-indigo-500" />
                                    </div>

                                    {project.assignedWorkers?.length ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {project.assignedWorkers.map((worker) => {
                                                const workerId = resolveWorkerId(worker);
                                                const active = selectedEntry.workerIds.includes(workerId);

                                                return (
                                                    <button
                                                        key={workerId}
                                                        type="button"
                                                        disabled={!isSelectedDateEditable}
                                                        onClick={() => toggleWorkerOnSelectedDate(workerId)}
                                                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                                            active
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                                                                : 'border-white/50 bg-white dark:bg-slate-900/50 text-gray-800 dark:text-gray-100 dark:border-white/10'
                                                        } ${!isSelectedDateEditable ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    >
                                                        <span className="font-semibold">{worker?.name || 'Worker'}</span>
                                                        <span className="text-xs font-bold uppercase tracking-wider">
                                                            {active ? 'Working' : 'Off'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Assign workers to the project first.</p>
                                    )}
                                </div>
                            </div>

                            {saveMessage && (
                                <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                                    saveMessage.includes('Failed') || saveMessage.includes('Error')
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                }`}>
                                    {saveMessage}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={savePlanner}
                                    disabled={saving}
                                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold shadow-sm hover:opacity-90 disabled:opacity-60"
                                >
                                    <Save size={16} className="mr-2" />
                                    {saving ? 'Saving...' : 'Save Planner'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-white/10 rounded-[28px] p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Project Summary</h3>
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                                    <Calendar size={18} className="mr-3 text-indigo-500" />
                                    <span>Start: {project.startDate ? DateTime.fromISO(normalizeDateKey(project.startDate)).toLocaleString(DateTime.DATE_MED) : 'Not set'}</span>
                                </div>
                                <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                                    <Clock size={18} className="mr-3 text-indigo-500" />
                                    <span>Deadline: {project.deadline ? DateTime.fromISO(normalizeDateKey(project.deadline)).toLocaleString(DateTime.DATE_MED) : 'Not set'}</span>
                                </div>
                                <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                                    <Clock size={18} className="mr-3 text-indigo-500" />
                                    <span>Expected Time: {project.expectedHours || 0} hours</span>
                                </div>
                                <div className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
                                    <Users size={18} className="mr-3 text-indigo-500" />
                                    <span>{project.assignedWorkers?.length || 0} team members assigned</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-[28px] border border-indigo-100 dark:border-indigo-800 p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Customer Info</h3>
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm mr-4">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{project.customerId?.name || 'Unknown Customer'}</p>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{project.customerId?.email || 'No email available'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-white/10 rounded-[28px] p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Assigned Team</h3>
                            {project.assignedWorkers?.length ? (
                                <div className="space-y-3">
                                    {project.assignedWorkers.map((worker) => (
                                        <button
                                            key={resolveWorkerId(worker)}
                                            type="button"
                                            onClick={() => navigate(`/workers/${resolveWorkerId(worker)}`)}
                                            className="w-full flex items-center p-4 bg-white/80 dark:bg-slate-900/50 border border-white/50 dark:border-white/10 rounded-2xl hover:shadow-sm transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-sm mr-3">
                                                {worker?.name?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{worker?.name || 'Unknown'}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No workers assigned.</p>
                            )}
                        </div>

                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-white/10 rounded-[28px] p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Materials</h3>
                            {project.materials?.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {project.materials.map((item, index) => (
                                        <span key={`${item}-${index}`} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            <Package size={12} className="mr-2" />
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No materials listed.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-8">
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/50 dark:border-white/10 rounded-[28px] p-6 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Daily Logs for {DateTime.fromISO(selectedDate).toLocaleString(DateTime.DATE_HUGE)}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    See who is planned to work, the planned hours, and the logs submitted on the selected date.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="rounded-2xl bg-slate-100 dark:bg-slate-900/50 px-4 py-3">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Planned Hours</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedEntry.hours || 0}h</div>
                                </div>
                                <div className="rounded-2xl bg-slate-100 dark:bg-slate-900/50 px-4 py-3">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Workers Planned</div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedWorkers.length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-5">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                Workers on this date
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedWorkers.length ? selectedWorkers.map((worker) => (
                                    <span
                                        key={resolveWorkerId(worker)}
                                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                    >
                                        {worker?.name || 'Worker'}
                                    </span>
                                )) : (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">No workers planned for this date yet.</span>
                                )}
                            </div>
                        </div>

                        <div className="mb-6 max-w-sm">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                Filter Logs by Worker
                            </label>
                            <div className="relative">
                                <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={selectedWorkerId}
                                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                                    className="w-full rounded-2xl border border-white/50 dark:border-white/10 bg-white dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100"
                                >
                                    <option value="">All workers</option>
                                    {workerFilterOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {visibleLogs.length ? (
                            <div className="space-y-5">
                                {visibleLogs.map((log) => {
                                    const lat = toNumber(log.location?.lat);
                                    const lng = toNumber(log.location?.lng);
                                    const hasCoords = lat !== null && lng !== null && (lat !== 0 || lng !== 0);
                                    const address = log.location?.address;
                                    const hasAddress = address && address !== 'Could not detect location' && address !== 'No location detected';
                                    const geoLabel = hasAddress
                                        ? address
                                        : hasCoords
                                            ? `Geo: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
                                            : 'No location';
                                    const imageSrc = resolveImageUrl(log.imageUrl);

                                    return (
                                        <div key={log._id} className="rounded-[24px] border border-white/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 p-5">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {log.workerName || 'Worker'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {DateTime.fromISO(log.date).isValid
                                                            ? DateTime.fromISO(log.date).toLocaleString(DateTime.DATETIME_MED)
                                                            : log.date}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 md:text-right">
                                                    {geoLabel}
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{log.description || 'No description provided.'}</p>

                                            {imageSrc && (
                                                <div className="mt-4">
                                                    <img
                                                        src={imageSrc}
                                                        alt="Daily log"
                                                        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-600"
                                                    />
                                                </div>
                                            )}

                                            {hasCoords && (
                                                <div className="mt-4">
                                                    <div className="w-full max-w-lg rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-600">
                                                        <MapContainer
                                                            center={mapCenter(lat, lng)}
                                                            zoom={15}
                                                            style={{ height: 240, width: '100%' }}
                                                            scrollWheelZoom={false}
                                                        >
                                                            <TileLayer
                                                                attribution="&copy; OpenStreetMap contributors"
                                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                            />
                                                            <Marker position={mapCenter(lat, lng)}>
                                                                <Popup>{geoLabel}</Popup>
                                                            </Marker>
                                                        </MapContainer>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                No daily logs found for this date{selectedWorkerId ? ' and worker' : ''}.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
