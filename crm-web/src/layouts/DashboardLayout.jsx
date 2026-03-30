import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const DashboardLayout = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="h-screen w-full flex bg-white/30 dark:bg-gray-900/40 backdrop-blur-2xl overflow-hidden transition-colors duration-300 font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                <Topbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6 lg:p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
