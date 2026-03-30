import React, { useEffect, useState } from 'react';
import axios from '../utils/axiosConfig';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import ProjectForm from '../components/forms/ProjectForm';
import { Plus, Filter, Trash2 } from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');

    // Modal State
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
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch projects');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleFormSuccess = () => {
        setIsModalOpen(false);
        fetchProjects();
    };

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

    const handleDeleteClick = (project) => {
        setProjectToDelete(project);
        setIsDeleteModalOpen(true);
    };

    const filteredProjects = filter === 'All'
        ? projects
        : projects.filter(p => p.status === filter);

    if (loading && projects.length === 0) return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-white/40 dark:bg-slate-800/40 rounded-lg animate-pulse"></div>
                <div className="h-10 w-32 bg-white/40 dark:bg-slate-800/40 rounded-xl animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="glass-panel p-6 rounded-3xl h-48 animate-pulse flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="h-5 w-3/4 bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                            <div className="h-3 w-full bg-gray-200/50 dark:bg-slate-700/50 rounded"></div>
                        </div>
                        <div className="flex justify-between items-center mt-6">
                            <div className="h-6 w-20 bg-gray-200/50 dark:bg-slate-700/50 rounded-full"></div>
                            <div className="h-8 w-24 bg-gray-200/50 dark:bg-slate-700/50 rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    // Keep error visible but allow retry or showing empty state if needed?
    if (error) return <div className="p-4 text-center text-red-600 dark:text-red-400">{error}</div>;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <p className="text-gray-500 font-medium mb-1 dark:text-gray-400">Manage your ongoing jobs and installations</p>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Projects</h1>
                </div>

                <div className="flex mt-4 md:mt-0 space-x-4">
                    <div className="relative">
                        <select
                            className="appearance-none bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-gray-700 dark:text-gray-200 py-3 px-5 pr-10 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-medium transition-all hover:bg-white/60"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-600 dark:text-gray-400">
                            <Filter size={18} />
                        </div>
                    </div>

                    <button
                        onClick={handleCreateProject}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={20} /> New Project
                    </button>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400">No projects found. Create your first project to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            onEdit={handleEditProject}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProject ? 'Edit Project' : 'Create New Project'}
            >
                <ProjectForm
                    project={editingProject}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setIsModalOpen(false)}
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
                        Are you sure you want to delete project <span className="font-bold text-gray-900 dark:text-white">{projectToDelete?.title}</span>?
                    </p>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8">
                        This action cannot be undone. All associated data will be permanently removed.
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
                            {isDeleting ? 'Deleting...' : 'Delete Project'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Projects;
