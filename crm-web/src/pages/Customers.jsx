import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import CustomerForm from '../components/forms/CustomerForm';
import { UserPlus, Mail, Phone, MapPin, Trash2, Users, ArrowRight } from 'lucide-react';

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/customers');
            setCustomers(data);
        } catch {
            setError('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCustomers(); }, []);

    const handleConfirmDelete = async () => {
        if (!customerToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/customers/${customerToDelete._id}`);
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
            fetchCustomers();
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-56 rounded-3xl animate-pulse bg-white/40"></div>)}
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

            {/* Quick stat */}
            <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 w-fit">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Users size={18} />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-400">Total Clients</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{customers.length}</p>
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
                    {customers.map((customer) => (
                        <div key={customer._id} className="glass-panel rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden flex flex-col">
                            {/* Top bar */}
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

                                {/* Contact details */}
                                <div className="space-y-2.5 flex-1">
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

                                {/* Footer */}
                                <div className="mt-5 pt-4 border-t border-gray-100/70 dark:border-white/5 flex items-center justify-between">
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
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}>
                <CustomerForm
                    customer={editingCustomer}
                    onSuccess={(newCustomer) => {
                        setIsFormModalOpen(false);
                        fetchCustomers();
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
