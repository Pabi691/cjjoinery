import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, User, Mail, Phone, Lock, Eye, EyeOff, Hammer, ArrowRight, Shield, RefreshCw } from 'lucide-react';

const inputCls = "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white text-sm pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400 dark:focus:ring-rose-500 placeholder-gray-400 transition-all";
const labelCls = "flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

const Signup = () => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const otpRefs = useRef([]);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await axios.post('/auth/send-otp', { name, email, phone, password });
            setStep(2);
            setCountdown(60);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (idx, val) => {
        if (!/^\d*$/.test(val)) return;
        const next = [...otp];
        next[idx] = val.slice(-1);
        setOtp(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (text.length === 6) {
            setOtp(text.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter the full 6-digit code'); return; }
        setError('');
        setIsLoading(true);
        try {
            const { data } = await axios.post('/auth/verify-otp', { email, otp: code });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setOtp(['', '', '', '', '', '']);
        setIsLoading(true);
        try {
            await axios.post('/auth/send-otp', { name, email, phone, password });
            setCountdown(60);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code');
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
            <div className="relative w-full max-w-md mx-4 my-8">
                <div className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-rose-200/40 dark:shadow-black/40 border border-white/80 dark:border-white/10 overflow-hidden">

                    {/* Top accent bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />

                    <div className="px-8 pt-8 pb-10">
                        {/* Logo */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-300/50 dark:shadow-rose-900/40 mb-4">
                                <Hammer size={28} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">CJ Joinery</h1>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Create Account</p>
                        </div>

                        {/* Step indicators */}
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <div className={`flex items-center gap-2 text-xs font-bold ${step === 1 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1 ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'}`}>
                                    {step > 1 ? '✓' : '1'}
                                </div>
                                <span>Your Details</span>
                            </div>
                            <div className={`h-px w-8 transition-colors ${step === 2 ? 'bg-rose-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            <div className={`flex items-center gap-2 text-xs font-bold transition-all ${step === 2 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2 ? 'bg-rose-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                    2
                                </div>
                                <span>Verify Email</span>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 px-4 py-3 rounded-xl">
                                {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className={labelCls}><User size={11} /> Full Name</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith" required className={inputCls} />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className={labelCls}><Mail size={11} /> Email Address</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputCls} />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className={labelCls}><Phone size={11} /> Phone</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 000000" required className={inputCls} />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className={labelCls}><Lock size={11} /> Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input
                                            type={showPw ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••"
                                            required
                                            className={`${inputCls} pr-11`}
                                        />
                                        <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading}
                                    className="w-full mt-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 shadow-lg shadow-rose-300/40 dark:shadow-rose-900/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2">
                                    {isLoading ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending Code…</>
                                    ) : (
                                        <>Send Verification Code <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-5">
                                {/* OTP header */}
                                <div className="text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-3">
                                        <Shield size={24} />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">A verification code has been sent to the</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">Administrator</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ask the admin for the code to continue</p>
                                </div>

                                {/* OTP boxes */}
                                <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={el => otpRefs.current[idx] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                            className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30 transition-all"
                                        />
                                    ))}
                                </div>

                                <button type="submit" disabled={isLoading || otp.join('').length < 6}
                                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 shadow-lg shadow-rose-300/40 dark:shadow-rose-900/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2">
                                    {isLoading ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account…</>
                                    ) : (
                                        <>Verify &amp; Create Account <ArrowRight size={16} /></>
                                    )}
                                </button>

                                {/* Resend */}
                                <div className="text-center">
                                    {countdown > 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Resend code in <span className="font-bold text-rose-600 dark:text-rose-400">{countdown}s</span>
                                        </p>
                                    ) : (
                                        <button type="button" onClick={handleResend} disabled={isLoading}
                                            className="text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors flex items-center gap-1.5 mx-auto disabled:opacity-50">
                                            <RefreshCw size={13} /> Resend Code
                                        </button>
                                    )}
                                </div>

                                <button type="button" onClick={() => { setStep(1); setError(''); setOtp(['', '', '', '', '', '']); }}
                                    className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-center">
                                    ← Back to edit details
                                </button>
                            </form>
                        )}

                        {step === 1 && (
                            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                Already have an account?{' '}
                                <Link to="/login" className="font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-5">
                    CJ Joinery © {new Date().getFullYear()} · Admin Portal
                </p>
            </div>
        </div>
    );
};

export default Signup;
