const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/validate-token
router.post('/validate-token', authController.validateToken);

// GET /api/auth/is-admin?email=...
router.get('/is-admin', authController.isAdmin);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register
router.post('/register', authController.register);

module.exports = router; 