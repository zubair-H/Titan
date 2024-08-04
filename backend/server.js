import { config } from 'dotenv';
config();

const { PORT, mongoDBURL } = process.env;



import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authRoutes from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors(

));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/vite-project/dist')));


// Connecting to the database
mongoose.connect(`${mongoDBURL}`)
    .then(() => {
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        console.log('Database connected');
    })
    .catch((error) => {
        console.error('Database connection error:', error);
    });

// Mounting authRoutes
app.use('/', authRoutes);
//app.get('/testing-endpoint', (res, req) => {
  //  res.json({ message: 'Backend is working!' });
  //});

// Serve the React app for all frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/vite-project/dist', 'index.html'));
});

