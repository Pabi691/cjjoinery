import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import Modal from '../components/Modal';
import CustomerForm from '../components/forms/CustomerForm';
import {
    ArrowLeft, Mail, Phone, MapPin, Edit, Briefcase,
    CheckCircle2, Clock, Calendar, Users, ArrowRight
} from 'lucide-react';
import { DateTime } from 'luxon';

const statusConfig = (status) => {
    switch (status) {
        case 'Completed':   return { bar: 'from-emerald-400 to-teal-400',  badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' };
        case 'In Progress': return { bar: 'from-blue-400 to-cyan-400',     badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
        case 'Scheduled':   return { bar: 'from-violet-400 to-purple-400', badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' };
        case 'Cancelled':   return { bar: 'from-red-400 to-rose-400',      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
        default:            return { bar: 'from-gray-300 to-gray-400',     badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
    }
};

const StatCard = ({ icon: Icon, label, value, gradient, glow }) => (
    <div className={`relative overflow-hidden rounded-3xl p-5 shadow-lg ${glow} ${gradient} flex items-center gap-4`}>
        <div className="absolute -right-3 -bottom-3 opacity-10">
            <Icon size={72} className="text-white" />
        </div>
        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-white text-3xl font-black">{value}</p>
        </div>
    </div>
);

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [custRes, jobsRes] = await Promise.all([
                axios.get(`/customers/${id}`),
                axios.get('/jobs')
            ]);
            setCustomer(custRes.data);
            setProjects(jobsRes.data.filter(j => {
                const cid = j.customerId?._id || j.customerId;
                return cid === id;
            }));
        } catch {
            setError('Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-40 bg-white/40 rounded-xl"></div>
            <div className="glass-panel rounded-3xl p-8 h-40"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-3xl bg-white/40"></div>)}
            </div>
        </div>
    );

    if (error || !customer) return (
        <div className="p-6 text-center text-red-500">{error || 'Customer not found'}</div>
    );

    const total     = projects.length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const active    = projects.filter(p => p.status === 'In Progress').length;
    const scheduled = projects.filter(p => p.status === 'Scheduled').length;

    const formatAddress = (addr) => {
        if (!addr) return null;
        return typeof addr === 'object' ? Object.values(addr).filter(Boolean).join(', ') : addr;
    };

    return (
        <div className="space-y-8">
            {/* Back */}
            <button
                onClick={() => navigate('/customers')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Customers
            </button>

            {/* Profile header */}
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-black text-3xl shadow-inner flex-shrink-0">
                            {customer.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Client / Project Owner</p>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white">{customer.name}</h1>
                            <div className="flex flex-wrap gap-4 mt-3">
                                {customer.email && (
                                    <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                        <Mail size={14} /> {customer.email}
                                    </a>
                                )}
                                {customer.phone && (
                                    <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline">
                                        <Phone size={14} /> {customer.phone}
                                    </a>
                                )}
                                {formatAddress(customer.address) && (
                                    <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                        <MapPin size={14} className="text-rose-400" /> {formatAddress(customer.address)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditOpen(true)}
                        className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all hover:-translate-y-0.5"
                    >
                        <Edit size={16} /> Edit Customer
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Briefcase}   label="Total Projects" value={total}     gradient="bg-gradient-to-br from-violet-500 to-purple-400"  glow="shadow-violet-200 dark:shadow-violet-900/30" />
                <StatCard icon={CheckCircle2} label="Completed"     value={completed} gradient="bg-gradient-to-br from-emerald-500 to-teal-400"   glow="shadow-emerald-200 dark:shadow-emerald-900/30" />
                <StatCard icon={Clock}        label="In Progress"   value={active}    gradient="bg-gradient-to-br from-blue-500 to-cyan-400"       glow="shadow-blue-200 dark:shadow-blue-900/30" />
                <StatCard icon={Calendar}     label="Scheduled"     value={scheduled} gradient="bg-gradient-to-br from-amber-500 to-orange-400"    glow="shadow-amber-200 dark:shadow-amber-900/30" />
            </div>

            {/* Projects table */}
            <div className="glass-panel rounded-3xl overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 to-purple-400" />
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center">
                            <Briefcase size={18} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Services &amp; Projects</h2>
                    </div>

                    {projects.length === 0 ? (
                        <div className="text-center py-14">
                            <Briefcase size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="text-gray-400 dark:text-gray-500 font-medium">No projects found for this customer.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map(project => {
                                const { bar, badge } = statusConfig(project.status);
                                return (
                                    <div key={project._id} className="relative flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-2xl hover:bg-white/70 dark:hover:bg-white/10 transition-all">
                                        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b ${bar}`}></div>
                                        <div className="ml-2 flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white truncate">{project.title}</p>
                                            {project.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{project.description}</p>
                                            )}
                                        </div>
                                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${badge}`}>{project.status}</span>
                                        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            <Users size={13} />
                                            <span>{project.assignedWorkers?.length || 0}</span>
                                        </div>
                                        <div className="hidden md:flex flex-col text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            {project.startDate && <span>{DateTime.fromISO(project.startDate).toLocaleString(DateTime.DATE_MED)}</span>}
                                            {project.deadline && <span>→ {DateTime.fromISO(project.deadline).toLocaleString(DateTime.DATE_MED)}</span>}
                                        </div>
                                        <button
                                            onClick={() => navigate(`/projects/${project._id}`)}
                                            className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-800 transition-colors whitespace-nowrap"
                                        >
                                            View <ArrowRight size={13} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Customer">
                <CustomerForm
                    customer={customer}
                    onSuccess={() => { setIsEditOpen(false); fetchData(); }}
                    onCancel={() => setIsEditOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default CustomerDetails;
