import { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import EnquiryForm from '../components/forms/EnquiryForm';
import { Plus, MessageSquare, CheckCircle2, XCircle, Clock, FileText, Trash2, Edit2, ArrowRight } from 'lucide-react';

const statusConfig = {
    New:    { color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',        dot: 'bg-sky-400' },
    Quoted: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', dot: 'bg-amber-400' },
    Won:    { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-400' },
    Lost:   { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',         dot: 'bg-red-400' },
};

const Enquiries = () => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEnquiry, setEditingEnquiry] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/enquiries');
            setEnquiries(data);
        } catch {
            setError('Failed to fetch enquiries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEnquiries(); }, []);

    const handleDelete = async () => {
        if (!toDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/enquiries/${toDelete._id}`);
            setIsDeleteOpen(false);
            setToDelete(null);
            fetchEnquiries();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete enquiry');
        } finally {
            setIsDeleting(false);
        }
    };

    const filters = ['All', 'New', 'Quoted', 'Won', 'Lost'];
    const filtered = filter === 'All' ? enquiries : enquiries.filter(e => e.status === filter);

    const stats = [
        { label: 'Total Enquiries', value: enquiries.length,                                    icon: MessageSquare, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
        { label: 'New',             value: enquiries.filter(e => e.status === 'New').length,    icon: Clock,         color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
        { label: 'Quoted',          value: enquiries.filter(e => e.status === 'Quoted').length, icon: FileText,      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
        { label: 'Won',             value: enquiries.filter(e => e.status === 'Won').length,    icon: CheckCircle2,  color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        { label: 'Lost',            value: enquiries.filter(e => e.status === 'Lost').length,   icon: XCircle,       color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    ];

    const wonRate = enquiries.length > 0
        ? Math.round((enquiries.filter(e => e.status === 'Won').length / enquiries.length) * 100)
        : 0;

    if (loading && enquiries.length === 0) return (
        <div className="space-y-8">
            <div className="h-10 w-56 bg-white/40 rounded-2xl animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse bg-white/40"></div>)}
            </div>
        </div>
    );

    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Step 1 of workflow</p>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Enquiries <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-cyan-400">&amp; Leads</span>
                    </h1>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">New or unconfirmed work requests from customers</p>
                </div>
                <button
                    onClick={() => { setEditingEnquiry(null); setIsFormOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 shadow-lg shadow-sky-200 dark:shadow-sky-900/30 transition-all hover:-translate-y-0.5 self-start"
                >
                    <Plus size={18} /> New Enquiry
                </button>
            </div>

            {/* Workflow banner */}
            <div className="glass-panel rounded-2xl p-4 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-400">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-black">1</div>
                    Enquiry
                </div>
                <ArrowRight size={16} className="text-gray-300 dark:text-gray-600" />
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-500 dark:text-amber-400">
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-black">2</div>
                    Quote
                </div>
                <ArrowRight size={16} className="text-gray-300 dark:text-gray-600" />
                <div className="flex items-center gap-2 text-sm font-semibold text-violet-500 dark:text-violet-400">
                    <div className="w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-black">3</div>
                    Project
                </div>
                <div className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                    Win rate: <span className="font-black text-emerald-600 dark:text-emerald-400">{wonRate}%</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 leading-tight">{s.label}</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {filters.map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            filter === f
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                                : 'bg-white/60 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Enquiry list */}
            {filtered.length === 0 ? (
                <div className="glass-panel rounded-3xl py-20 text-center">
                    <MessageSquare size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {filter === 'All' ? 'No enquiries yet. Add your first one.' : `No ${filter} enquiries.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((enq) => {
                        const cfg = statusConfig[enq.status] || statusConfig.New;
                        return (
                            <div key={enq._id} className="glass-panel rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-all">
                                {/* Status dot */}
                                <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`}></div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{enq.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                {enq.customerId?.name || 'Unknown customer'} · {enq.customerId?.email}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${cfg.color}`}>
                                            {enq.status}
                                        </span>
                                    </div>

                                    {enq.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{enq.description}</p>
                                    )}
                                    {enq.notes && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{enq.notes}</p>
                                    )}

                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        {new Date(enq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => { setEditingEnquiry(enq); setIsFormOpen(true); }}
                                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => { setToDelete(enq); setIsDeleteOpen(true); }}
                                        className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingEnquiry ? 'Edit Enquiry' : 'New Enquiry'}>
                <EnquiryForm
                    enquiry={editingEnquiry}
                    onSuccess={() => { setIsFormOpen(false); fetchEnquiries(); }}
                    onCancel={() => setIsFormOpen(false)}
                />
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onClose={() => !isDeleting && setIsDeleteOpen(false)} title="Delete Enquiry">
                <div className="text-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Delete <span className="text-red-500">{toDelete?.title}</span>?</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This will not delete any linked quotes.</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setIsDeleteOpen(false)} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                        <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">{isDeleting ? 'Deleting…' : 'Delete'}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Enquiries;
