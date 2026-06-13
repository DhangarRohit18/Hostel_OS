import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Root test endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Smart Hostel OS Backend API' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Smart Hostel OS Backend running on http://localhost:${PORT}`);
});
