const express = require('express');
const router = express.Router();
const { updateHistory, getHistory, deleteHistory, clearAllHistory } = require('../controllers/watchHistoryController');
const { requireAuth } = require('../middleware/auth');

// Update or create watch history
router.post('/', requireAuth, updateHistory);

// Get user's watch history
router.get('/', requireAuth, getHistory);

// Delete specific history item
router.delete('/:historyId', requireAuth, deleteHistory);

// Clear all history
router.delete('/', requireAuth, clearAllHistory);

module.exports = router;
