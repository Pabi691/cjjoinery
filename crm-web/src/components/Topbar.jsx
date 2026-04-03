import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Search, User, X, Clock } from 'lucide-react';
import axios from '../utils/axiosConfig';
import Modal from './Modal';

const typeLabel = (type) => {
    switch (type) {
        case 'status_change': return { label: 'Status Change', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
        case 'daily_log':     return { label: 'Daily Log',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
        default:              return { label: type || 'Notification', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
    }
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationDetail = ({ notification }) => {
    if (!notification) return null;
    const { label, color } = typeLabel(notification.type);
    const d = notification.details || {};

    return (
        <div className="space-y-5">
            {/* Header row */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                    {notification.workerName?.charAt(0) || '?'}
                </div>
                <div>
                    <p className="font-bold text-gray-900 dark:text-white">{notification.workerName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.createdAt).toLocaleString()}
                    </p>
                </div>
                <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
            </div>

            {/* Message */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">{notification.message}</p>
            </div>

            {/* Details */}
            {notification.type === 'status_change' && (
                <div className="grid grid-cols-2 gap-3">
                    {d.status && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">New Status</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{d.status}</p>
                        </div>
                    )}
                    {d.effectiveToday && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Currently Today</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{d.effectiveToday}</p>
                        </div>
                    )}
                    {d.date && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Effective Date</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{d.date}</p>
                        </div>
                    )}
                    {d.note && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Note</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{d.note}</p>
                        </div>
                    )}
                </div>
            )}

            {notification.type === 'daily_log' && (
                <div className="grid grid-cols-2 gap-3">
                    {(d.jobTitle || d.project) && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Project</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{d.jobTitle || d.project}</p>
                        </div>
                    )}
                    {d.date && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Date</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{d.date}</p>
                        </div>
                    )}
                    {d.description && (
                        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{d.description}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Fallback for unknown types with extra fields */}
            {notification.type !== 'status_change' && notification.type !== 'daily_log' && Object.keys(d).length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(d).map(([key, val]) => (
                        <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{String(val)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Topbar = () => {
    const { theme, toggleTheme } = useTheme();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const [notifications, setNotifications] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const { data } = await axios.get('/notifications');
            setNotifications(data || []);
        } catch (_) {}
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const unreadCount = notifications.length;

    const openDetail = (notification) => {
        setSelectedNotification(notification);
        setDropdownOpen(false);
        setIsModalOpen(true);
    };

    return (
        <>
            <header className="h-24 flex items-center justify-between px-8 bg-transparent">
                <div className="flex items-center bg-white/60 dark:bg-gray-800/50 backdrop-blur-md rounded-full px-5 py-3 w-80 border border-white/60 shadow-sm transition-all focus-within:bg-white/90">
                    <Search size={20} className="text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search Dashboard..."
                        className="bg-transparent border-none focus:outline-none ml-3 text-sm text-gray-800 dark:text-gray-200 w-full placeholder-gray-400"
                    />
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* Bell with dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(prev => !prev)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors relative"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                {/* Dropdown header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                            {unreadCount} total
                                        </span>
                                        <button onClick={() => setDropdownOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                                    {notifications.length === 0 ? (
                                        <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                                            <Bell size={28} className="mx-auto mb-2 opacity-30" />
                                            No notifications yet
                                        </div>
                                    ) : (
                                        notifications.slice(0, 15).map((n) => {
                                            const { label, color } = typeLabel(n.type);
                                            return (
                                                <button
                                                    key={n._id}
                                                    onClick={() => openDetail(n)}
                                                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">
                                                            {n.workerName?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{n.workerName}</span>
                                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${color}`}>{label}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.message}</p>
                                                        </div>
                                                        <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 flex items-center gap-1 mt-0.5">
                                                            <Clock size={11} /> {timeAgo(n.createdAt)}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3 ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <User size={18} />
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{userInfo.name || 'User'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userInfo.role || 'Role'}</p>
                        </div>
                    </div>
                </div>
            </header>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Notification Details">
                <NotificationDetail notification={selectedNotification} />
            </Modal>
        </>
    );
};

export default Topbar;
