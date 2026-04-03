import { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import QuoteForm from '../components/forms/QuoteForm';
import {
    Plus, Trash2, FileText, Clock, CheckCircle2, XCircle,
    DollarSign, ChevronDown, ChevronUp, Edit
} from 'lucide-react';
import { DateTime } from 'luxon';

const statusConfig = (status) => {
    switch (status) {
        case 'Approved': return { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300', bar: 'from-emerald-400 to-teal-400', dot: 'bg-emerald-400' };
        case 'Rejected': return { badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',             bar: 'from-red-400 to-rose-400',      dot: 'bg-red-400' };
        default:         return { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',     bar: 'from-amber-400 to-orange-400',  dot: 'bg-amber-400' };
    }
};

const fmt = (date) => date ? DateTime.fromISO(date).toLocaleString(DateTime.DATE_MED) : '—';

const QuoteRow = ({ quote, onEdit, onDelete, onStatusChange }) => {
    const [expanded, setExpanded] = useState(false);
    const { badge, bar } = statusConfig(quote.status);

    return (
        <div className="glass-panel rounded-2xl overflow-hidden transition-all duration-200">
            <div className={`h-1 w-full bg-gradient-to-r ${bar}`} />
            <div className="p-4">
                {/* Main row */}
                <div className="flex items-center gap-4">
                    {/* Quote number */}
                    <div className="w-24 flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Quote #</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{quote.quoteNumber}</p>
                    </div>

                    {/* Customer */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Customer</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {quote.customerId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{quote.customerId?.email}</p>
                    </div>

                    {/* Items count */}
                    <div className="hidden sm:block w-16 text-center flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Items</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{quote.items?.length || 0}</p>
                    </div>

                    {/* Valid until */}
                    <div className="hidden md:block w-28 flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Valid Until</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{fmt(quote.validUntil)}</p>
                    </div>

                    {/* Total */}
                    <div className="w-24 text-right flex-shrink-0">
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Total</p>
                        <p className="text-base font-black text-violet-700 dark:text-violet-400">£{(quote.total || 0).toLocaleString()}</p>
                    </div>

                    {/* Status badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${badge}`}>
                        {quote.status}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => onEdit(quote)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                            <Edit size={15} />
                        </button>
                        <button onClick={() => onDelete(quote)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 size={15} />
                        </button>
                        <button onClick={() => setExpanded(p => !p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                    </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100/70 dark:border-white/5 space-y-4">
                        {/* Line items table */}
                        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/5">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80 dark:bg-white/5">
                                    <tr>
                                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Description</th>
                                        <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                                        <th className="text-right px-3 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Unit Price</th>
                                        <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                    {quote.items?.map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">{item.description}</td>
                                            <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">£{(item.price || 0).toFixed(2)}</td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-gray-900 dark:text-white">£{((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals + Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            {/* Totals */}
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl p-4 space-y-1.5 border border-violet-100 dark:border-violet-800/30 min-w-[220px]">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                    <span>Subtotal</span><span className="font-semibold">£{(quote.subtotal || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                    <span>VAT</span><span className="font-semibold">£{(quote.vat || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-black text-gray-900 dark:text-white border-t border-violet-200 dark:border-violet-700 pt-1.5">
                                    <span>Total</span><span className="text-violet-700 dark:text-violet-400">£{(quote.total || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Status actions */}
                            {quote.status === 'Pending' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onStatusChange(quote._id, 'Approved')}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 shadow-sm transition-all"
                                    >
                                        <CheckCircle2 size={15} /> Approve
                                    </button>
                                    <button
                                        onClick={() => onStatusChange(quote._id, 'Rejected')}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-400 hover:from-red-600 hover:to-rose-500 shadow-sm transition-all"
                                    >
                                        <XCircle size={15} /> Reject
                                    </button>
                                </div>
                            )}
                            {quote.status !== 'Pending' && (
                                <button
                                    onClick={() => onStatusChange(quote._id, 'Pending')}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                >
                                    <Clock size={15} /> Reset to Pending
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Quotes = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/quotes');
            setQuotes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuotes(); }, []);

    const handleStatusChange = async (id, status) => {
        try {
            await axios.put(`/quotes/${id}`, { status });
            fetchQuotes();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDelete = async () => {
        if (!quoteToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/quotes/${quoteToDelete._id}`);
            setIsDeleteOpen(false);
            setQuoteToDelete(null);
            fetchQuotes();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete quote');
        } finally {
            setIsDeleting(false);
        }
    };

    const pending  = quotes.filter(q => q.status === 'Pending');
    const approved = quotes.filter(q => q.status === 'Approved');
    const revenue  = approved.reduce((s, q) => s + (q.total || 0), 0);

    const filtered = filter === 'All' ? quotes : quotes.filter(q => q.status === filter);

    const statCards = [
        { label: 'Total Quotes',   value: quotes.length,                    icon: FileText,    gradient: 'bg-gradient-to-br from-violet-500 to-purple-400', glow: 'shadow-violet-200 dark:shadow-violet-900/30' },
        { label: 'Pending',        value: pending.length,                   icon: Clock,       gradient: 'bg-gradient-to-br from-amber-500 to-orange-400',  glow: 'shadow-amber-200 dark:shadow-amber-900/30' },
        { label: 'Approved',       value: approved.length,                  icon: CheckCircle2,gradient: 'bg-gradient-to-br from-emerald-500 to-teal-400',  glow: 'shadow-emerald-200 dark:shadow-emerald-900/30' },
        { label: 'Total Revenue',  value: `£${revenue.toLocaleString()}`,   icon: DollarSign,  gradient: 'bg-gradient-to-br from-blue-500 to-cyan-400',     glow: 'shadow-blue-200 dark:shadow-blue-900/30' },
    ];

    if (loading && quotes.length === 0) return (
        <div className="space-y-8">
            <div className="h-10 w-56 bg-white/40 rounded-2xl animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-3xl animate-pulse bg-white/40"></div>)}
            </div>
            <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse bg-white/40"></div>)}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Pricing &amp; estimates</p>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Quotes <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-400">&amp; Revenue</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <div className="flex bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-xl p-1 gap-1">
                        {['All','Pending','Approved','Rejected'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    filter === f
                                        ? 'bg-violet-600 text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { setEditingQuote(null); setIsFormOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 shadow-lg shadow-violet-200 dark:shadow-violet-900/30 transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={18} /> New Quote
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className={`relative overflow-hidden rounded-3xl p-5 shadow-lg ${s.glow} ${s.gradient} flex items-center gap-4`}>
                            <div className="absolute -right-3 -bottom-3 opacity-10">
                                <Icon size={72} className="text-white" />
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Icon size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{s.label}</p>
                                <p className="text-white text-2xl font-black">{s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quotes list */}
            {quotes.length === 0 ? (
                <div className="glass-panel rounded-3xl py-20 text-center">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No quotes yet. Create your first quote.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel rounded-3xl py-14 text-center">
                    <p className="text-gray-400 dark:text-gray-500 font-medium">No {filter.toLowerCase()} quotes found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(quote => (
                        <QuoteRow
                            key={quote._id}
                            quote={quote}
                            onEdit={(q) => { setEditingQuote(q); setIsFormOpen(true); }}
                            onDelete={(q) => { setQuoteToDelete(q); setIsDeleteOpen(true); }}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingQuote ? `Edit ${editingQuote.quoteNumber}` : 'Create New Quote'}>
                <QuoteForm
                    quote={editingQuote}
                    onSuccess={() => { setIsFormOpen(false); fetchQuotes(); }}
                    onCancel={() => setIsFormOpen(false)}
                />
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onClose={() => !isDeleting && setIsDeleteOpen(false)} title="Delete Quote">
                <div className="text-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                        Delete <span className="text-red-500">{quoteToDelete?.quoteNumber}</span>?
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone.</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setIsDeleteOpen(false)} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                        <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">{isDeleting ? 'Deleting…' : 'Delete'}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Quotes;
