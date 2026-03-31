import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, UserCheck, FileText, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/projects', label: 'Projects', icon: Briefcase },
        { path: '/customers', label: 'Customers', icon: UserCheck },
        { path: '/workers', label: 'Workers', icon: Users },
        { path: '/invoices', label: 'Invoices', icon: FileText },
        // { path: '/settings', label: 'Settings', icon: Settings },
    ];

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    };

    return (
        <aside className="glass-sidebar w-64 h-full flex flex-col transition-all duration-300 z-20 border-r border-gray-200/50 dark:border-white/10">
            <div className="h-20 flex items-center px-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">CJ Joinery</h1>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3.5 rounded-2xl backdrop-blur-sm transition-all duration-200 font-medium ${isActive
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md transform scale-[1.02]'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                        >
                            <Icon size={20} className="mr-3" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                >
                    <LogOut size={20} className="mr-3" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
