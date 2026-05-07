const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const connectDB = require('../config/db');

const ensureDb = async () => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        await connectDB();
    }
    return mongoose.connection && mongoose.connection.readyState === 1;
};

// In-memory OTP store: email -> { otp, data, expiresAt }
const otpStore = new Map();

const getTransporter = () => nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
        return;
    }

    res.status(401);
    throw new Error('Invalid email or password');
});

// @desc    Register a new user (direct, no OTP — kept for backwards compat)
// @route   POST /api/auth
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phone, address } = req.body;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password, phone, address });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    });
});

// @desc    Send OTP to email for signup verification
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('An account with this email already exists');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email, { otp, data: { name, email, phone, password }, expiresAt });

    const transporter = getTransporter();
    await transporter.sendMail({
        from: `"CJ Joinery" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New signup request — verification code for ${name}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f3f4f6;">
                <div style="background:linear-gradient(135deg,#e11d48,#f472b6);padding:28px 32px;">
                    <h2 style="color:#fff;margin:0;font-size:22px;font-weight:900;letter-spacing:-0.5px;">CJ Joinery</h2>
                    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Management Portal — Admin Notification</p>
                </div>
                <div style="padding:32px;">
                    <p style="color:#374151;font-size:15px;margin:0 0 8px;">New account signup request:</p>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                        <tr><td style="color:#9ca3af;font-size:13px;padding:4px 0;">Name</td><td style="color:#111827;font-weight:700;font-size:14px;">${name}</td></tr>
                        <tr><td style="color:#9ca3af;font-size:13px;padding:4px 0;">Email</td><td style="color:#111827;font-weight:700;font-size:14px;">${email}</td></tr>
                        <tr><td style="color:#9ca3af;font-size:13px;padding:4px 0;">Phone</td><td style="color:#111827;font-weight:700;font-size:14px;">${phone}</td></tr>
                    </table>
                    <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">Share this verification code with the applicant to approve their account:</p>
                    <div style="background:#fdf2f8;border:2px dashed #f9a8d4;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                        <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Verification Code</p>
                        <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#be123c;">${otp}</div>
                    </div>
                    <p style="color:#9ca3af;font-size:13px;margin:0;">This code expires in <strong>10 minutes</strong>. Only share it if you want to approve this signup.</p>
                </div>
            </div>
        `,
    });

    res.json({ message: 'Verification code sent to your email' });
});

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtpAndRegister = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }

    const entry = otpStore.get(email);
    if (!entry) {
        res.status(400);
        throw new Error('No verification code found. Please request a new one.');
    }

    if (Date.now() > entry.expiresAt) {
        otpStore.delete(email);
        res.status(400);
        throw new Error('Verification code has expired. Please request a new one.');
    }

    if (entry.otp !== otp) {
        res.status(400);
        throw new Error('Invalid verification code');
    }

    otpStore.delete(email);

    const { name, phone, password } = entry.data;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('An account with this email already exists');
    }

    const user = await User.create({ name, email, password, phone, address: {} });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
    });
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
    if (!(await ensureDb())) {
        res.status(503);
        throw new Error('Database not connected');
    }
    const users = await User.find({}).select('-password');
    res.json(users);
});

module.exports = { authUser, registerUser, sendOtp, verifyOtpAndRegister, getUsers };
