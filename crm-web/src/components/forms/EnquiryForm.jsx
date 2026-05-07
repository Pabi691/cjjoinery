import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

const EnquiryForm = ({ enquiry, onSuccess, onCancel }) => {
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '', customerId: '', notes: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/customers').then(r => setCustomers(r.data)).catch(() => {});
        if (enquiry) {
            setFormData({
                title: enquiry.title || '',
                description: enquiry.description || '',
                customerId: enquiry.customerId?._id || enquiry.customerId || '',
                notes: enquiry.notes || '',
            });
        }
    }, [enquiry]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customerId) { setError('Please select a customer.'); return; }
        if (!formData.title.trim()) { setError('Please enter a title.'); return; }
        setLoading(true);
        setError('');
        try {
            if (enquiry) {
                await axios.put(`/enquiries/${enquiry._id}`, formData);
            } else {
                await axios.post('/enquiries', formData);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save enquiry');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-400";
    const labelCls = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">{error}</div>}

            <div>
                <label className={labelCls}>Customer</label>
                <select name="customerId" value={formData.customerId} onChange={handleChange} className={inputCls} required>
                    <option value="">Select customer…</option>
                    {customers.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                    ))}
                </select>
            </div>

            <div>
                <label className={labelCls}>Project Title</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Kitchen cabinet installation"
                    className={inputCls}
                    required
                />
            </div>

            <div>
                <label className={labelCls}>Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the work required…"
                    className={inputCls}
                />
            </div>

            <div>
                <label className={labelCls}>Notes (optional)</label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Any additional notes…"
                    className={inputCls}
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-600 hover:to-cyan-500 shadow-lg shadow-sky-200 dark:shadow-sky-900/30 disabled:opacity-50 transition-all">
                    {loading ? 'Saving…' : (enquiry ? 'Update Enquiry' : 'Save Enquiry')}
                </button>
            </div>
        </form>
    );
};

export default EnquiryForm;
