import express from "express";
import authenticateToken from "../middleware/auth.js";
import { markLessonComplete } from "../controllers/progressController.js";

const router = express.Router();

// All progress routes require authentication
router.use(authenticateToken);

router.post(
  "/courses/:courseId/lessons/:sectionId/:lessonId/complete",
  markLessonComplete
);

export default router;
