const express = require('express');
const router = express.Router();
const { authUser, registerUser, sendOtp, verifyOtpAndRegister, getUsers } = require('../controllers/authController');

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndRegister);
router.get('/users', getUsers);

module.exports = router;
