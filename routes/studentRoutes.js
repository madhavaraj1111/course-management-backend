const express = require('express');
const authenticateToken = require('../middleware/auth');
const { getStudentDashboard } = require('../controllers/studentController');

const router = express.Router();

// All student routes require authentication
router.use(authenticateToken);

router.get('/dashboard', getStudentDashboard);

module.exports = router;