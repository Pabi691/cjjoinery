const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUsers } = require('../controllers/authController');

router.post('/', registerUser);
router.post('/login', authUser);
router.get('/users', getUsers);

module.exports = router;
