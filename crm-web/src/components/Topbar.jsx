import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Search, User } from 'lucide-react';

const Topbar = () => {
    const { theme, toggleTheme } = useTheme();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    return (
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
