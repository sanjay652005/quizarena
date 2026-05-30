const express = require('express');
const router = express.Router();
const { sendInvite } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');
const { inviteRules, validate } = require('../middleware/validationMiddleware');

router.post('/invite', protect, inviteRules, validate, sendInvite);

module.exports = router;
