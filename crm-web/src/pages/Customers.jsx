import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import CustomerForm from '../components/forms/CustomerForm';
import { UserPlus, Mail, Phone, MapPin, Trash2, Users, ArrowRight, PoundSterling, Briefcase, Clock } from 'lucide-react';

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cRes, qRes, jRes] = await Promise.all([
                axios.get('/customers'),
                axios.get('/quotes'),
                axios.get('/jobs'),
            ]);
            setCustomers(cRes.data);
            setQuotes(qRes.data);
            setJobs(jRes.data);
        } catch {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    // Compute per-customer financial data
    const getCustomerFinancials = (customerId) => {
        const id = customerId.toString();
        const customerQuotes = quotes.filter(q => (q.customerId?._id || q.customerId)?.toString() === id);
        const customerJobs   = jobs.filter(j => (j.customerId?._id || j.customerId)?.toString() === id);

        const totalRevenue  = customerQuotes.filter(q => q.status === 'Approved').reduce((s, q) => s + (q.total || 0), 0);
        const pendingValue  = customerQuotes.filter(q => q.status === 'Pending').reduce((s, q) => s + (q.total || 0), 0);
        const activeProjects = customerJobs.filter(j => j.status === 'In Progress').length;
        const totalProjects  = customerJobs.length;

        return { totalRevenue, pendingValue, activeProjects, totalProjects };
    };

    // Global totals
    const totalRevenue  = quotes.filter(q => q.status === 'Approved').reduce((s, q) => s + (q.total || 0), 0);
    const pendingValue  = quotes.filter(q => q.status === 'Pending').reduce((s, q) => s + (q.total || 0), 0);
    const activeProjects = jobs.filter(j => j.status === 'In Progress').length;

    const handleConfirmDelete = async () => {
        if (!customerToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/customers/${customerToDelete._id}`);
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete customer. They might have active projects.');
        } finally {
            setIsDeleting(false);
        }
    };

    const formatAddress = (addr) => {
        if (!addr) return null;
        return typeof addr === 'object' ? Object.values(addr).filter(Boolean).join(', ') : addr;
    };

    if (loading && customers.length === 0) return (
        <div className="space-y-8">
            <div className="h-10 w-56 bg-white/40 rounded-2xl animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse bg-white/40"></div>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-72 rounded-3xl animate-pulse bg-white/40"></div>)}
            </div>
        </div>
    );

    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Client base</p>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Customers <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">&amp; Clients</span>
                    </h1>
                </div>
                <button
                    onClick={() => { setEditingCustomer(null); setIsFormModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all hover:-translate-y-0.5 self-start"
                >
                    <UserPlus size={18} /> Add Customer
                </button>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Users size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400">Total Clients</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{customers.length}</p>
                    </div>
                </div>
                <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                        <PoundSterling size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400">Total Revenue</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">£{totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
                <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400">Pending Quotes</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">£{pendingValue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
                <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Briefcase size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400">Active Projects</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{activeProjects}</p>
                    </div>
                </div>
            </div>

            {/* Cards */}
            {customers.length === 0 ? (
                <div className="glass-panel rounded-3xl py-20 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No customers yet. Add your first client.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map((customer) => {
                        const fin = getCustomerFinancials(customer._id);
                        return (
                            <div key={customer._id} className="glass-panel rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col">
                                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />

                                <div className="p-6 flex flex-col flex-1">
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-black text-xl shadow-inner flex-shrink-0">
                                            {customer.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">{customer.name}</h3>
                                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mt-0.5">Client / Project Owner</p>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                                <Mail size={13} className="text-blue-500" />
                                            </div>
                                            <span className="truncate">{customer.email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                                                <Phone size={13} className="text-violet-500" />
                                            </div>
                                            <span>{customer.phone || 'No phone'}</span>
                                        </div>
                                        {formatAddress(customer.address) && (
                                            <div className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <MapPin size={13} className="text-rose-500" />
                                                </div>
                                                <span className="line-clamp-2">{formatAddress(customer.address)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Financial summary */}
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl p-3 space-y-1.5 border border-emerald-100 dark:border-emerald-900/30 mb-4">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">Revenue received</span>
                                            <span className="font-bold text-emerald-700 dark:text-emerald-300">£{fin.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">Pending quotes</span>
                                            <span className="font-bold text-amber-600 dark:text-amber-400">£{fin.pendingValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-xs border-t border-emerald-100 dark:border-emerald-900/30 pt-1.5 mt-1">
                                            <span className="text-gray-500 dark:text-gray-400">Projects</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{fin.totalProjects} total · {fin.activeProjects} active</span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-1 border-t border-gray-100/70 dark:border-white/5 flex items-center justify-between">
                                        <button
                                            onClick={() => { setCustomerToDelete(customer); setIsDeleteModalOpen(true); }}
                                            className="flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => { setEditingCustomer(customer); setIsFormModalOpen(true); }}
                                                className="text-xs font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => navigate(`/customers/${customer._id}`)}
                                                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
                                            >
                                                View <ArrowRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}>
                <CustomerForm
                    customer={editingCustomer}
                    onSuccess={(newCustomer) => {
                        setIsFormModalOpen(false);
                        fetchAll();
                        if (newCustomer?._id && !editingCustomer) {
                            setCustomers(prev => [...prev, newCustomer]);
                        }
                    }}
                    onCancel={() => setIsFormModalOpen(false)}
                />
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => !isDeleting && setIsDeleteModalOpen(false)} title="Delete Customer">
                <div className="text-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Delete <span className="text-red-500">{customerToDelete?.name}</span>?</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Cannot delete customers with active projects.</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                        <button onClick={handleConfirmDelete} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">{isDeleting ? 'Deleting…' : 'Delete'}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Customers;
