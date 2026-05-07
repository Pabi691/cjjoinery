import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Mail, Lock, Eye, EyeOff, Hammer, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw]     = useState(false);
    const [error, setError]       = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { data } = await axios.post('/auth/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">

            {/* Background blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-gradient-to-br from-rose-300/40 to-pink-300/20 dark:from-rose-900/20 dark:to-pink-900/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[28rem] h-[28rem] bg-gradient-to-br from-amber-300/40 to-orange-200/30 dark:from-amber-900/20 dark:to-orange-900/10 rounded-full blur-3xl pointer-events-none" />

            {/* Theme toggle */}
            <button
                onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
                className="absolute top-5 right-5 p-2.5 rounded-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/60 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-sm"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Card */}
            <div className="relative w-full max-w-md mx-4">
                <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-rose-200/40 dark:shadow-black/40 border border-white/80 dark:border-white/10 overflow-hidden">

                    {/* Top accent bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />

                    <div className="px-8 pt-8 pb-10">
                        {/* Logo + brand */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-300/50 dark:shadow-rose-900/40 mb-4">
                                <Hammer size={28} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">CJ Joinery</h1>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Management Portal</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    <Mail size={11} /> Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@cjjoinery.com"
                                        required
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white text-sm pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-500 placeholder-gray-400 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    <Lock size={11} /> Password
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        required
                                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white text-sm pl-10 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-500 placeholder-gray-400 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(p => !p)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 shadow-lg shadow-rose-300/40 dark:shadow-rose-900/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Signing in…
                                    </>
                                ) : (
                                    <>
                                        Sign In <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer link */}
                        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Subtle bottom label */}
                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-5">
                    CJ Joinery © {new Date().getFullYear()} · Admin Portal
                </p>
            </div>
        </div>
    );
};

export default Login;
