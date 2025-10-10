import express from "express";
import authenticateToken from "../middleware/auth.js";
import {
  getAllCourses,
  getCourseById,
  enrollInCourse,
} from "../controllers/courseController.js";

const router = express.Router();

// All course routes require authentication
router.use(authenticateToken);

router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.post("/:id/enroll", enrollInCourse);

export default router;
