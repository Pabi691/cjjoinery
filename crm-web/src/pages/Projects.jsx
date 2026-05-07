import { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import ProjectForm from '../components/forms/ProjectForm';
import { Plus, Filter, Trash2, Briefcase, CheckCircle2, Clock, XCircle, PoundSterling } from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/jobs');
            setProjects(data);
        } catch (err) {
            setError('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/jobs/${projectToDelete._id}`);
            setIsDeleteModalOpen(false);
            setProjectToDelete(null);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete project');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredProjects = filter === 'All' ? projects : projects.filter(p => p.status === filter);

    // Financial: sum quote totals from linked quotes
    const totalProjectValue = projects.reduce((s, p) => s + (p.quoteId?.total || 0), 0);
    const completedValue    = projects.filter(p => p.status === 'Completed').reduce((s, p) => s + (p.quoteId?.total || 0), 0);
    const activeValue       = projects.filter(p => p.status === 'In Progress').reduce((s, p) => s + (p.quoteId?.total || 0), 0);

    const stats = [
        { label: 'Total',       value: projects.length,                                         icon: Briefcase,    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
        { label: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length,  icon: Clock,        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        { label: 'Completed',   value: projects.filter(p => p.status === 'Completed').length,    icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        { label: 'Cancelled',   value: projects.filter(p => p.status === 'Cancelled').length,    icon: XCircle,      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    ];

    if (loading && projects.length === 0) return (
        <div className="space-y-8">
            <div className="h-10 w-56 bg-white/40 rounded-2xl animate-pulse"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse bg-white/40"></div>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-56 rounded-3xl animate-pulse bg-white/40"></div>)}
            </div>
        </div>
    );

    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Manage your work</p>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        Projects <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-400">& Jobs</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <div className="relative">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-white/10 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm transition-all"
                        >
                            <option value="All">All Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <Filter size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {/* New project */}
                    <button
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 shadow-lg shadow-violet-200 dark:shadow-violet-900/30 transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={18} /> New Project
                    </button>
                </div>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                        <PoundSterling size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400">Total Project Value</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">£{totalProjectValue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
                <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Clock size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400">In Progress Value</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">£{activeValue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
                <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400">Completed Value</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">£{completedValue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">{s.label}</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid */}
            {projects.length === 0 ? (
                <div className="glass-panel rounded-3xl py-20 text-center">
                    <Briefcase size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No projects yet. Create your first project.</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="glass-panel rounded-3xl py-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No projects match the selected filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            onEdit={(p) => { setEditingProject(p); setIsModalOpen(true); }}
                            onDelete={(p) => { setProjectToDelete(p); setIsDeleteModalOpen(true); }}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProject ? 'Edit Project' : 'Create New Project'}>
                <ProjectForm project={editingProject} onSuccess={() => { setIsModalOpen(false); fetchProjects(); }} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => !isDeleting && setIsDeleteModalOpen(false)} title="Delete Project">
                <div className="text-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
                        <Trash2 size={28} className="text-red-500" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">Delete <span className="text-red-500">{projectToDelete?.title}</span>?</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This action cannot be undone.</p>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                        <button onClick={handleConfirmDelete} disabled={isDeleting} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50">{isDeleting ? 'Deleting…' : 'Delete'}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Projects;
