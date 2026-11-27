
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import reportRoutes from './routes/reports.js';
import trackingRoutes from './routes/tracking.js';
import leaderboardRoutes from './routes/leaderboard.js';
import startScheduler from './jobs/scheduler.js';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_, res) =>
  res.json({
    status: 'ok',
    app: 'LifeTrack API'
  })
);

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30
  }),
  authRoutes
);

app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api', dataRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: 'Server error'
  });
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    startScheduler();

    app.listen(port, () =>
      console.log(`LifeTrack API listening on ${port}`)
    );
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
