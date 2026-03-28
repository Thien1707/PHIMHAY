const mongoose = require('mongoose');

/** @enum {0|1} VIEW_NORMAL = all logged-in; VIEW_VIP = VIP only */
const VIEW_NORMAL = 0;
const VIEW_VIP = 1;

const movieSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true },
    originName: { type: String, default: '' },
    posterUrl: { type: String, default: '' },
    thumbUrl: { type: String, default: '' },
    year: { type: Number, default: null },
    type: { type: String, default: '' },
    content: { type: String, default: '' },
    country: { type: String, default: '' },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],
    seriesId: { type: String, default: '', index: true, trim: true },
    partNumber: { type: Number, default: null, min: 1 },
    /** 0 = normal+Vip xem; 1 = chỉ VIP */
    viewStatus: { type: Number, enum: [VIEW_NORMAL, VIEW_VIP], default: VIEW_NORMAL },
    /**
     * public: guest + user đều xem được bình luận/đánh giá (chỉ user đăng nhập mới gửi).
     * members: chỉ user đăng nhập xem được danh sách bình luận/đánh giá.
     */
    commentRatingPolicy: { type: String, enum: ['public', 'members'], default: 'public' },
    isActive: { type: Boolean, default: true },
    externalId: { type: String, default: '' }
  },
  { timestamps: true }
);

movieSchema.statics.VIEW_NORMAL = VIEW_NORMAL;
movieSchema.statics.VIEW_VIP = VIEW_VIP;
movieSchema.index({ seriesId: 1, partNumber: 1 });

module.exports = mongoose.model('Movie', movieSchema);
