import express from "express";
import authenticateToken from "../middleware/auth.js";
import requireAdmin from "../middleware/admin.js";
import {
  createCourse,
  getAdminCourses,
  updateCourse,
  deleteCourse,
  getDashboardStats,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.post("/courses", createCourse);
router.get("/courses", getAdminCourses);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);
router.get("/dashboard", getDashboardStats);

export default router;
