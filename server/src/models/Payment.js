const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    txnRef: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    vnpResponse: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
