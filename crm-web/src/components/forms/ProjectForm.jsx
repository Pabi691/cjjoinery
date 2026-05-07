import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

const getAllowedStatuses = (startDate, deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = startDate ? new Date(startDate) : null;
    const end = deadline ? new Date(deadline) : null;
    if (!start && !end) return ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
    if (start && today < start) return ['Scheduled', 'Cancelled'];
    if (start && end && today >= start && today <= end) return ['In Progress', 'Cancelled'];
    if (end && today > end) return ['Completed', 'Cancelled'];
    if (start && today >= start && !end) return ['In Progress', 'Completed', 'Cancelled'];
    return ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
};

const getAutoStatus = (startDate, deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = startDate ? new Date(startDate) : null;
    const end = deadline ? new Date(deadline) : null;
    if (!start && !end) return null;
    if (start && today < start) return 'Scheduled';
    if (start && today >= start && (!end || today <= end)) return 'In Progress';
    return null;
};

const ProjectForm = ({ project, onSuccess, onCancel }) => {
    const [approvedQuotes, setApprovedQuotes] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Scheduled',
        startDate: '',
        deadline: '',
        expectedHours: '',
        customerId: '',
        assignedWorkers: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workersRes, quotesRes] = await Promise.all([
                    axios.get('/workers'),
                    axios.get('/quotes'),
                ]);
                setWorkers(workersRes.data);
                setApprovedQuotes(quotesRes.data.filter(q => q.status === 'Approved'));
            } catch (err) {
                console.error('Failed to fetch data', err);
            }
        };
        fetchData();

        if (project) {
            const startDate = project.startDate ? project.startDate.split('T')[0] : '';
            const deadline  = project.deadline  ? project.deadline.split('T')[0]  : '';
            const allowed   = getAllowedStatuses(startDate, deadline);
            const autoStatus = getAutoStatus(startDate, deadline);
            const resolvedStatus = allowed.includes(project.status)
                ? project.status
                : (autoStatus || allowed[0]);

            setSelectedQuoteId(project.quoteId?._id || project.quoteId || '');
            setFormData({
                title: project.title || '',
                description: project.description || '',
                status: resolvedStatus,
                startDate,
                deadline,
                expectedHours: project.expectedHours || '',
                customerId: project.customerId?._id || project.customerId || '',
                assignedWorkers: project.assignedWorkers?.map(w => w._id || w) || [],
            });
        }
    }, [project]);

    const handleQuoteChange = (e) => {
        const id = e.target.value;
        setSelectedQuoteId(id);
        if (id) {
            const q = approvedQuotes.find(q => q._id === id);
            if (q) {
                setFormData(prev => ({
                    ...prev,
                    title: q.enquiryId?.title || prev.title,
                    description: q.enquiryId?.description || prev.description,
                    customerId: q.customerId?._id || q.customerId || prev.customerId,
                }));
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'startDate' || name === 'deadline') {
                const autoStatus = getAutoStatus(updated.startDate, updated.deadline);
                const allowed    = getAllowedStatuses(updated.startDate, updated.deadline);
                if (autoStatus) {
                    updated.status = autoStatus;
                } else if (!allowed.includes(updated.status)) {
                    updated.status = allowed[0];
                }
            }
            return updated;
        });
    };

    const handleWorkerChange = (e) => {
        const workerId  = e.target.value;
        const isChecked = e.target.checked;
        setFormData(prev => ({
            ...prev,
            assignedWorkers: isChecked
                ? [...prev.assignedWorkers, workerId]
                : prev.assignedWorkers.filter(id => id !== workerId),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customerId) { setError('Please select a customer (choose a quote above).'); return; }
        setLoading(true);
        setError('');
        try {
            const payload = { ...formData, quoteId: selectedQuoteId || undefined };
            if (project) {
                await axios.put(`/jobs/${project._id}`, payload);
            } else {
                await axios.post('/jobs', payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400";
    const labelCls = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

    const selectedQuote = approvedQuotes.find(q => q._id === selectedQuoteId);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">{error}</div>}

            {/* Approved Quote selector */}
            <div>
                <label className={labelCls}>
                    From Approved Quote <span className="text-gray-400 font-normal normal-case">(fills title, description &amp; customer)</span>
                </label>
                <select value={selectedQuoteId} onChange={handleQuoteChange} className={inputCls}>
                    <option value="">Select approved quote…</option>
                    {approvedQuotes.map(q => (
                        <option key={q._id} value={q._id}>
                            {q.quoteNumber} — {q.enquiryId?.title || 'No title'} — {q.customerId?.name} — £{q.total?.toFixed(2)}
                        </option>
                    ))}
                </select>
                {approvedQuotes.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">No approved quotes yet. Approve a quote first to create a project from it.</p>
                )}
                {selectedQuote && (
                    <div className="mt-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                        Quote value: £{selectedQuote.total?.toFixed(2)} · Customer: {selectedQuote.customerId?.name}
                    </div>
                )}
            </div>

            {/* Project Title */}
            <div>
                <label className={labelCls}>Project Title</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Auto-filled from quote, or enter manually"
                    required
                    className={inputCls}
                />
            </div>

            {/* Description */}
            <div>
                <label className={labelCls}>Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Auto-filled from enquiry description"
                    className={inputCls}
                />
            </div>

            {/* Status + Dates */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className={labelCls}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className={inputCls}>
                        {getAllowedStatuses(formData.startDate, formData.deadline).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Start Date</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Deadline</label>
                    <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className={inputCls} />
                </div>
            </div>

            {/* Expected Hours */}
            <div>
                <label className={labelCls}>Expected Time (Hours)</label>
                <input
                    type="number"
                    name="expectedHours"
                    value={formData.expectedHours}
                    onChange={handleChange}
                    className={inputCls}
                />
            </div>

            {/* Assign Workers */}
            <div>
                <label className={labelCls}>Assign Workers</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-xl p-3 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700">
                    {workers.length === 0 && <p className="text-xs text-gray-400">No workers available</p>}
                    {workers.map(worker => (
                        <div key={worker._id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`worker-${worker._id}`}
                                value={worker._id}
                                checked={formData.assignedWorkers.includes(worker._id)}
                                onChange={handleWorkerChange}
                                className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-400"
                            />
                            <label htmlFor={`worker-${worker._id}`} className="text-sm text-gray-900 dark:text-gray-200">
                                {worker.name}
                                <span className={`ml-1.5 text-xs font-medium ${worker.availability === 'On Leave' ? 'text-amber-500' : 'text-gray-400'}`}>
                                    ({worker.availability})
                                </span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 shadow-lg shadow-violet-200 dark:shadow-violet-900/30 disabled:opacity-50 transition-all"
                >
                    {loading ? 'Saving…' : (project ? 'Update Project' : 'Create Project')}
                </button>
            </div>
        </form>
    );
};

export default ProjectForm;
