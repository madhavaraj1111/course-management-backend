const express = require('express');
const authenticateToken = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const {
  createCourse,
  getAdminCourses,
  updateCourse,
  deleteCourse,
  getDashboardStats,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.post('/courses', createCourse);
router.get('/courses', getAdminCourses);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.get('/dashboard', getDashboardStats);

module.exports = router;