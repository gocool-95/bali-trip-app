const mongoose = require('mongoose');
const Activity = require('./models/Activity');
const itinerary = require('./seed/itinerary.json');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bali-trip';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Activity.deleteMany({});
    console.log('Cleared existing activities');

    const activities = itinerary.map(item => ({
      ...item,
      updatedAt: Date.now()
    }));

    await Activity.insertMany(activities);
    console.log(`Seeded ${activities.length} activities`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
