const express = require('express');
const authenticateToken = require('../middleware/auth');
const { markLessonComplete } = require('../controllers/progressController');

const router = express.Router();

// All progress routes require authentication
router.use(authenticateToken);

router.post('/courses/:courseId/lessons/:sectionId/:lessonId/complete', markLessonComplete);

module.exports = router;