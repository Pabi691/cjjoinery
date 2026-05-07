import React, { useState, useEffect } from 'react';
import { User, AtSign, Lock, Mail, Phone, PoundSterling, Clock, Wrench, Circle } from 'lucide-react';
import axios from '../../utils/axiosConfig';

const inputCls = "w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 placeholder-gray-400 transition-all";
const labelCls = "flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

const statusColors = {
    Available: 'text-emerald-600 dark:text-emerald-400',
    Busy:      'text-amber-600 dark:text-amber-400',
    'On Leave':'text-red-500 dark:text-red-400',
};

const WorkerForm = ({ worker, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        hourlyRate: '',
        workHoursPerDay: '8',
        skills: '',
        availability: 'Available',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (worker) {
            setFormData({
                name: worker.name || '',
                username: worker.username || '',
                password: '',
                email: worker.email || '',
                phone: worker.phone || '',
                hourlyRate: worker.hourlyRate ?? '',
                workHoursPerDay: worker.workHoursPerDay ?? 8,
                skills: worker.skills ? worker.skills.join(', ') : '',
                availability: worker.availability || 'Available',
            });
        }
    }, [worker]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const payload = {
            ...formData,
            skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
            workHoursPerDay: Number(formData.workHoursPerDay) || 8,
        };
        if (worker && !payload.password) delete payload.password;
        try {
            if (worker) {
                await axios.put(`/workers/${worker._id}`, payload);
            } else {
                await axios.post('/workers', payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save worker');
        } finally {
            setLoading(false);
        }
    };

    const isEdit = Boolean(worker);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar hint */}
            <div className="flex items-center gap-4 pb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-black text-2xl flex-shrink-0">
                    {formData.name?.charAt(0)?.toUpperCase() || <User size={24} />}
                </div>
                <div>
                    <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                        {formData.name || (isEdit ? 'Edit Worker' : 'New Worker')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {isEdit ? 'Update worker details' : 'Fill in the details below'}
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
                <label className={labelCls}><User size={12} /> Full Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Bob Johnson"
                    required
                    className={inputCls}
                />
            </div>

            {/* Username + Password */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}><AtSign size={12} /> Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="e.g. bob.johnson"
                        required={!isEdit}
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>
                        <Lock size={12} /> {isEdit ? 'Reset Password' : 'Password'}
                    </label>
                    <input
                        type="text"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={isEdit ? 'Leave blank to keep' : 'Set password'}
                        required={!isEdit}
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls}><Mail size={12} /> Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="bob@example.com"
                        required
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}><Phone size={12} /> Phone</label>
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

            {/* Rate + Hours + Status */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className={labelCls}><PoundSterling size={12} /> Hourly Rate</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">£</span>
                        <input
                            type="number"
                            name="hourlyRate"
                            value={formData.hourlyRate}
                            onChange={handleChange}
                            placeholder="0"
                            required
                            min="0"
                            className={`${inputCls} pl-7`}
                        />
                    </div>
                </div>
                <div>
                    <label className={labelCls}><Clock size={12} /> Hours / Day</label>
                    <input
                        type="number"
                        name="workHoursPerDay"
                        value={formData.workHoursPerDay}
                        onChange={handleChange}
                        min="1"
                        max="24"
                        required
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}><Circle size={12} /> Status</label>
                    <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        className={`${inputCls} ${statusColors[formData.availability] || ''}`}
                    >
                        <option value="Available">Available</option>
                        <option value="Busy">Busy</option>
                        <option value="On Leave">On Leave</option>
                    </select>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Updates today only</p>
                </div>
            </div>

            {/* Skills */}
            <div>
                <label className={labelCls}><Wrench size={12} /> Skills <span className="normal-case font-normal text-gray-400">(comma separated)</span></label>
                <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. Carpentry, Plumbing, Electrical"
                    className={inputCls}
                />
                {formData.skills && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, i) => (
                            <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">
                                {skill}
                            </span>
                        ))}
                    </div>
                )}
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
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 shadow-lg shadow-amber-200 dark:shadow-amber-900/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                >
                    {loading ? 'Saving…' : isEdit ? 'Update Worker' : 'Add Worker'}
                </button>
            </div>
        </form>
    );
};

export default WorkerForm;
