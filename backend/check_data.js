const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const checkData = async () => {
    try {
        await connectDB();
        const count = await User.countDocuments();
        console.log(`User count: ${count}`);
        if (count > 0) {
            console.log('Users found.');
            const user = await User.findOne();
            console.log(user);
        } else {
            console.log('No users found.');
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
