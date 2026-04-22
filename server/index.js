/**
 * SLIIT Connect - Server Entry Point (Merged)
 * Features: Auth, Groups, Clubs, Sessions, Notes, Collections
 */
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        const dbName = mongoose.connection.name;
        console.log(`Connected to MongoDB database: ${dbName}`);
    })
    .catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
    res.send('SLIIT Connect API is running...');
});

// ─── Auth Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));

// ─── Group Routes ──────────────────────────────────────────────────────────
app.use('/api/groups', require('./routes/groupRoutes'));

// ─── Session Routes ────────────────────────────────────────────────────────
app.use('/api/sessions', require('./routes/Session'));

// ─── Club Routes ───────────────────────────────────────────────────────────
app.use('/api/clubs', require('./routes/clubRoutes'));

// ─── Notes Routes ──────────────────────────────────────────────────────────
app.use('/api/notes', require('./routes/notes'));
app.use('/api/collections', require('./routes/collections'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
