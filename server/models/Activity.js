const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true, min: 0, max: 10 },
  date: { type: String, required: true },
  time: { type: String, required: true },
  endTime: String,
  title: { type: String, required: true },
  location: { type: String, required: true },
  category: {
    type: String,
    enum: ['sightseeing', 'food', 'transport', 'adventure', 'relaxation', 'shopping'],
    default: 'sightseeing'
  },
  transport: { type: String, default: 'Private car' },
  notes: String,
  googleMapsUrl: String,
  latitude: Number,
  longitude: Number,
  bookingRef: String,
  confirmationNumber: String,
  ticketImages: [String],
  amount: Number,
  currency: { type: String, enum: ['IDR', 'USD'], default: 'IDR' },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'free'],
    default: 'free'
  },
  order: { type: Number, required: true },
  isDeleted: { type: Boolean, default: false },
  updatedAt: { type: Number, default: () => Date.now() }
});

activitySchema.index({ dayNumber: 1, order: 1 });
activitySchema.index({ updatedAt: 1 });

activitySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

activitySchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Activity', activitySchema);
