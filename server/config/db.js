const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://shahriarsakib1205_db_user:oSjwNqTC25MiSj4p@cluster0.4bvn9ac.mongodb.net/connecthub?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('📡 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Keep server alive, error will be surfaced if DB call is made
  }
};

module.exports = connectDB;
