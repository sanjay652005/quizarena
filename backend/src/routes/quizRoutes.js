const express = require('express');
const router = express.Router();
const { generate } = require('../controllers/quizController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { generateQuizRules, validate } = require('../middleware/validationMiddleware');

router.post('/generate', protect, restrictTo('host'), generateQuizRules, validate, generate);

module.exports = router;
