const express = require('express');
const router = express.Router();
const { create, join, getByCode, myRooms, results } = require('../controllers/roomController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { createRoomRules, validate } = require('../middleware/validationMiddleware');

// All room routes require authentication
router.use(protect);

router.post('/', restrictTo('host'), createRoomRules, validate, create);
router.post('/join', join);
router.get('/my/hosted', restrictTo('host'), myRooms);
router.get('/:code', getByCode);
router.get('/:id/results', results);

module.exports = router;
