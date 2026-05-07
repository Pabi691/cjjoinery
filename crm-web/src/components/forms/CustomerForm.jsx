import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import axios from '../../utils/axiosConfig';

const inputCls = "w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 placeholder-gray-400 transition-all";
const labelCls = "flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

const CustomerForm = ({ customer, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address
                    ? (typeof customer.address === 'object'
                        ? Object.values(customer.address).filter(Boolean).join(', ')
                        : customer.address)
                    : ''
            });
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (customer) {
                const res = await axios.put(`/customers/${customer._id}`, formData);
                onSuccess(res.data);
            } else {
                const res = await axios.post('/customers', formData);
                onSuccess(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    const isEdit = Boolean(customer);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar hint */}
            <div className="flex items-center gap-4 pb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-black text-2xl flex-shrink-0">
                    {formData.name?.charAt(0)?.toUpperCase() || <User size={24} />}
                </div>
                <div>
                    <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                        {formData.name || (isEdit ? 'Edit Customer' : 'New Customer')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {isEdit ? 'Update customer details' : 'Fill in the details below'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* Name */}
            <div>
                <label className={labelCls}>
                    <User size={12} /> Full Name
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. John Smith"
                    required
                    className={inputCls}
                />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}>
                        <Mail size={12} /> Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@example.com"
                        required
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>
                        <Phone size={12} /> Phone
                    </label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+44 7700 000000"
                        required
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Address */}
            <div>
                <label className={labelCls}>
                    <MapPin size={12} /> Address / Company Details
                </label>
                <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Street, City, Postcode"
                    className={inputCls}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                >
                    {loading ? 'Saving…' : isEdit ? 'Update Customer' : 'Add Customer'}
                </button>
            </div>
        </form>
    );
};

export default CustomerForm;
