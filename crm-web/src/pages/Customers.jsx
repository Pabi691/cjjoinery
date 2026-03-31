import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import CustomerForm from '../components/forms/CustomerForm';
import { UserPlus, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal States
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
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch customers');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleCreateCustomer = () => {
        setEditingCustomer(null);
        setIsFormModalOpen(true);
    };

    const handleEditCustomer = (customer) => {
        setEditingCustomer(customer);
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormModalOpen(false);
        fetchCustomers();
    };

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

    if (loading && customers.length === 0) return (
        <div className="space-y-8 p-6">
            <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-white/40 dark:bg-slate-800/40 rounded-lg animate-pulse"></div>
                <div className="h-10 w-32 bg-white/40 dark:bg-slate-800/40 rounded-xl animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="glass-panel p-6 rounded-3xl h-48 animate-pulse flex flex-col justify-between">
                         <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gray-200/50 dark:bg-slate-700/50"></div>
                            <div className="space-y-3 flex-1">
                                <div className="h-4 w-3/4 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                            </div>
                        </div>
                        <div className="h-8 w-24 bg-gray-200/50 dark:bg-slate-700/50 rounded-lg mt-4"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <p className="text-gray-500 font-medium mb-1 dark:text-gray-400">Manage your client base and their details</p>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Customers</h1>
                </div>
                <button
                    onClick={handleCreateCustomer}
                    className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all hover:-translate-y-0.5"
                >
                    <UserPlus size={20} /> Add Customer
                </button>
            </div>

            {customers.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400">No customers found. Click Add Customer to create one.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map((customer) => (
                        <div key={customer._id} className="glass-panel rounded-3xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 p-8 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-700/50 pb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-extrabold text-xl shadow-inner uppercase">
                                            {customer.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">{customer.name}</h3>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Client / Project Owner</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Mail size={16} className="mr-3 text-indigo-500" />
                                        <span className="truncate">{customer.email || 'No email provided'}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Phone size={16} className="mr-3 text-indigo-500" />
                                        <span>{customer.phone || 'No phone provided'}</span>
                                    </div>
                                    <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin size={16} className="mr-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                                        <span className="line-clamp-2">
                                            {customer.address 
                                                ? (typeof customer.address === 'object' 
                                                    ? Object.values(customer.address).filter(Boolean).join(', ') 
                                                    : customer.address)
                                                : 'No address provided'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100/50 dark:border-gray-700/50 flex justify-between items-center w-full">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(customer); }}
                                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                                <button
                                    onClick={() => handleEditCustomer(customer)}
                                    className="text-sm text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:text-indigo-800 dark:hover:text-indigo-300"
                                >
                                    <Edit size={14} /> Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingCustomer ? 'Edit Customer Info' : 'Add New Customer'}
            >
                <CustomerForm
                    customer={editingCustomer}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setIsFormModalOpen(false)}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title="Confirm Deletion"
            >
                <div className="p-2 sm:p-4">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <Trash2 size={32} />
                        </div>
                    </div>
                    <p className="text-center text-gray-700 dark:text-gray-300 mb-2">
                        Are you sure you want to delete customer <span className="font-bold text-gray-900 dark:text-white">{customerToDelete?.name}</span>?
                    </p>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
                        This action cannot be undone. You cannot delete a customer if they have associated projects.
                    </p>
                    
                    <div className="flex space-x-3 justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Customer'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Customers;
