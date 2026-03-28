const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, unique: 'Tên đăng nhập đã được dùng', trim: true, lowercase: true },
    phoneNumber: { type: String, default: '', trim: true },
    dateOfBirth: { type: Date, default: null },
    /**
     * male | female | other
     * (empty string means unspecified)
     */
    gender: { type: String, default: '', trim: true },
    isAdmin: { type: Boolean, default: false },
    isVip: { type: Boolean, default: false },
    vipExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.methods.isVipActive = function isVipActive() {
  if (!this.isVip) return false;
  if (!this.vipExpiresAt) return true;
  return this.vipExpiresAt.getTime() > Date.now();
};

module.exports = mongoose.model('User', userSchema);
