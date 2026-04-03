import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, UserCheck, FileText, LogOut, Hammer } from 'lucide-react';

const menuItems = [
    { path: '/',          label: 'Overview',  icon: LayoutDashboard, gradient: 'from-blue-500 to-cyan-400' },
    { path: '/projects',  label: 'Projects',  icon: Briefcase,       gradient: 'from-violet-500 to-purple-400' },
    { path: '/customers', label: 'Customers', icon: UserCheck,       gradient: 'from-emerald-500 to-teal-400' },
    { path: '/workers',   label: 'Workers',   icon: Users,           gradient: 'from-amber-500 to-orange-400' },
    { path: '/invoices',  label: 'Quotes',    icon: FileText,        gradient: 'from-rose-500 to-pink-400' },
];

const Sidebar = () => {
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    };

    return (
        <aside className="glass-sidebar w-64 h-full flex flex-col z-20 border-r border-gray-200/50 dark:border-white/10">
            {/* Brand */}
            <div className="h-20 flex items-center px-6 gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200 dark:shadow-rose-900/30">
                    <Hammer size={18} className="text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none">CJ Joinery</h1>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Management</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium ${
                                isActive
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                isActive
                                    ? `bg-gradient-to-br ${item.gradient} shadow-sm`
                                    : 'bg-gray-100 dark:bg-gray-700/50 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                            }`}>
                                <Icon size={16} className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                            </div>
                            <span className="text-sm">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-900"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 mb-2">
                <button
                    onClick={handleLogout}
                    className="group flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
                        <LogOut size={16} className="text-red-500 dark:text-red-400" />
                    </div>
                    <span className="text-sm font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
