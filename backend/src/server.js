import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoute.js';
import gameRoutes from './routes/gameRoute.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3222; // Changed port to match your URL if needed

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);

// Database Connection and Server Start
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully.");

    // Start the server only after the database connection is successful
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process with an error code
  });

