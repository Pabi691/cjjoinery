import { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import { Trash2, RotateCcw, AlertTriangle, Package } from 'lucide-react';

const TYPE_META = {
    worker:   { label: 'Worker',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',     dot: 'bg-amber-400' },
    job:      { label: 'Project',  color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',         dot: 'bg-blue-400' },
    customer: { label: 'Customer', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-400' },
    quote:    { label: 'Quote',    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',         dot: 'bg-rose-400' },
    enquiry:  { label: 'Enquiry',  color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', dot: 'bg-violet-400' },
};

const FILTERS = ['all', 'worker', 'job', 'customer', 'quote', 'enquiry'];

const TrashPage = () => {
    const [items, setItems]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [filter, setFilter]       = useState('all');
    const [actionId, setActionId]   = useState(null); // id being restored/deleted
    const [confirmEmpty, setConfirmEmpty] = useState(false);
    const [emptying, setEmptying]   = useState(false);

    const fetchTrash = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/trash');
            setItems(data || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTrash(); }, []);

    const handleRestore = async (id) => {
        setActionId(id);
        try {
            await axios.post(`/trash/${id}/restore`);
            setItems(prev => prev.filter(i => i._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Restore failed');
        } finally {
            setActionId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this item? This cannot be undone.')) return;
        setActionId(id);
        try {
            await axios.delete(`/trash/${id}`);
            setItems(prev => prev.filter(i => i._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        } finally {
            setActionId(null);
        }
    };

    const handleEmptyTrash = async () => {
        setEmptying(true);
        try {
            await axios.delete('/trash');
            setItems([]);
            setConfirmEmpty(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to empty trash');
        } finally {
            setEmptying(false);
        }
    };

    const filtered = filter === 'all' ? items : items.filter(i => i.itemType === filter);

    const fmtDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Deleted items</p>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Trash <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400">Box</span>
                    </h1>
                </div>
                {items.length > 0 && (
                    <button
                        onClick={() => setConfirmEmpty(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-400 hover:from-red-600 hover:to-rose-500 shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-all hover:-translate-y-0.5 self-start"
                    >
                        <Trash2 size={16} /> Empty Trash
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => {
                    const count = f === 'all' ? items.length : items.filter(i => i.itemType === f).length;
                    const meta  = f === 'all' ? null : TYPE_META[f];
                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize flex items-center gap-2 ${
                                filter === f
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow'
                                    : 'bg-white/60 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10'
                            }`}
                        >
                            {meta && <span className={`w-2 h-2 rounded-full ${meta.dot}`} />}
                            {f === 'all' ? 'All' : meta.label}
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                filter === f ? 'bg-white/20 text-white dark:text-gray-900 dark:bg-black/20' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                            }`}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl animate-pulse bg-white/40" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel rounded-3xl py-24 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
                        <Package size={36} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-400 dark:text-gray-500">Trash is empty</p>
                    <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Deleted items will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(item => {
                        const meta = TYPE_META[item.itemType] || TYPE_META.enquiry;
                        const busy = actionId === item._id;
                        return (
                            <div key={item._id} className="glass-panel rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg transition-all">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${meta.color}`}>
                                        {item.itemName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white truncate">{item.itemName}</p>
                                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                    <Trash2 size={11} />
                                    Deleted {fmtDate(item.deletedAt)}
                                </div>
                                <div className="flex gap-2 pt-1 border-t border-gray-100/60 dark:border-white/5">
                                    <button
                                        onClick={() => handleRestore(item._id)}
                                        disabled={busy}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50"
                                    >
                                        <RotateCcw size={13} /> {busy ? 'Restoring…' : 'Restore'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        disabled={busy}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 size={13} /> {busy ? 'Deleting…' : 'Delete Forever'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty Trash confirm modal */}
            {confirmEmpty && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-7 w-full max-w-sm shadow-2xl mx-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={26} className="text-red-500" />
                        </div>
                        <h3 className="text-center font-bold text-gray-900 dark:text-white text-lg mb-1">Empty Trash?</h3>
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                            All <span className="font-bold text-red-500">{items.length}</span> items will be permanently deleted. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmEmpty(false)} disabled={emptying} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleEmptyTrash} disabled={emptying} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">
                                {emptying ? 'Emptying…' : 'Empty Trash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrashPage;
