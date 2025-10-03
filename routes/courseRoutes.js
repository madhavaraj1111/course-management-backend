const express = require('express');
const authenticateToken = require('../middleware/auth');
const {
  getAllCourses,
  getCourseById,
  enrollInCourse,
} = require('../controllers/courseController');

const router = express.Router();

// All course routes require authentication
router.use(authenticateToken);

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/:id/enroll', enrollInCourse);

module.exports = router;