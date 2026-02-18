import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Search, User } from 'lucide-react';

const Topbar = () => {
    const { theme, toggleTheme } = useTheme();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    return (
        <header className="bg-white dark:bg-gray-800 h-16 shadow-sm flex items-center justify-between px-6 transition-colors duration-300">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 w-64">
                <Search size={18} className="text-gray-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent border-none focus:outline-none ml-2 text-sm text-gray-700 dark:text-gray-200 w-full"
                />
            </div>

            <div className="flex items-center space-x-4">
                <button
                    onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

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
    );
};

export default Topbar;
