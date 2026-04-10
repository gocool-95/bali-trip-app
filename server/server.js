const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const activitiesRouter = require('./routes/activities');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bali-trip';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/activities', activitiesRouter);

// Sync endpoint — full data dump (excludes soft-deleted)
app.get('/api/sync', async (req, res) => {
  const Activity = require('./models/Activity');
  try {
    const activities = await Activity.find({ isDeleted: { $ne: true } })
      .sort({ dayNumber: 1, order: 1 });
    res.json({ activities, syncedAt: Date.now() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
