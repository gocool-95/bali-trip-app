const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Activity = require('../models/Activity');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/activities — all activities, optionally filtered by ?since=timestamp
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.since) {
      // When syncing, include deleted items so client can remove them
      query.updatedAt = { $gt: Number(req.query.since) };
    } else {
      query.isDeleted = { $ne: true };
    }
    const activities = await Activity.find(query).sort({ dayNumber: 1, order: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activities/day/:dayNumber
router.get('/day/:dayNumber', async (req, res) => {
  try {
    const activities = await Activity.find({
      dayNumber: Number(req.params.dayNumber),
      isDeleted: { $ne: true }
    }).sort({ order: 1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activities — create
router.post('/', async (req, res) => {
  try {
    const activity = new Activity(req.body);
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/activities/:id — update
router.put('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/activities/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, updatedAt: Date.now() },
      { new: true }
    );
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json({ message: 'Deleted', id: activity._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activities/:id/ticket — upload ticket image
router.post('/:id/ticket', upload.single('ticket'), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    const imageUrl = `/uploads/${req.file.filename}`;
    activity.ticketImages = activity.ticketImages || [];
    activity.ticketImages.push(imageUrl);
    activity.updatedAt = Date.now();
    await activity.save();
    res.json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
