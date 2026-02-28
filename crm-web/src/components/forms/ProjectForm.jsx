import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';

const ProjectForm = ({ project, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Scheduled',
        deadline: '',
        customerId: '', // Ideally a select dropdown
        assignedWorkers: [] // Ideally a multi-select
    });
    const [workers, setWorkers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workersRes, customersRes] = await Promise.all([
                    axios.get('/workers'),
                    axios.get('/auth/users')
                ]);
                setWorkers(workersRes.data);
                setCustomers(customersRes.data);
            } catch (err) {
                console.error('Failed to fetch initial data', err);
            }
        };
        fetchData();

        if (project) {
            setFormData({
                title: project.title,
                description: project.description,
                status: project.status,
                deadline: project.deadline ? project.deadline.split('T')[0] : '',
                expectedHours: project.expectedHours || '',
                customerId: project.customerId?._id || project.customerId || '', // Handle populated or ID
                assignedWorkers: project.assignedWorkers?.map(w => w._id || w) || []
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWorkerChange = (e) => {
        const workerId = e.target.value;
        const isChecked = e.target.checked;
        if (isChecked) {
            setFormData(prev => ({ ...prev, assignedWorkers: [...prev.assignedWorkers, workerId] }));
        } else {
            setFormData(prev => ({ ...prev, assignedWorkers: prev.assignedWorkers.filter(id => id !== workerId) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (project) {
                await axios.put(`/jobs/${project._id}`, formData);
            } else {
                await axios.post('/jobs', formData);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Title</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2"
                ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2"
                    >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
                    <input
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Time (Hours)</label>
                <input
                    type="number"
                    name="expectedHours"
                    value={formData.expectedHours || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2"
                >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                            {customer.name} ({customer.email})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign Workers</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2 border-gray-200 dark:border-gray-700">
                    {workers.map(worker => (
                        <div key={worker._id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`worker-${worker._id}`}
                                value={worker._id}
                                checked={formData.assignedWorkers.includes(worker._id)}
                                onChange={handleWorkerChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`worker-${worker._id}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                {worker.name} ({worker.availability})
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Project'}
                </button>
            </div>
        </form>
    );
};

export default ProjectForm;
