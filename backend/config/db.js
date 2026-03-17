const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set');
      return null;
    }
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    if (mongoose.connection.readyState === 2 && mongoose.connection.asPromise) {
      await mongoose.connection.asPromise();
      return mongoose.connection;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // process.exit(1); // Removed to prevent server crash during dev/IP errors
    return null;
  }
};

module.exports = connectDB;
